import React, { useEffect, useRef, useState } from 'react';
import { X, Loader, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import Card from '../ui/Card';

/**
 * Guacamole Protocol Client for WebSocket RDP connections.
 * Implements the Guacamole protocol for encoding/decoding instructions.
 */
class GuacamoleClient {
    constructor(websocket) {
        this.websocket = websocket;
        this.buffer = '';
        this.oninstruction = null;
        this.state = 'IDLE'; // IDLE, CONNECTING, CONNECTED, DISCONNECTED, ERROR
    }

    /**
     * Encode instruction into Guacamole protocol format
     * Format: length.element,length.element,...;
     */
    static encodeInstruction(...elements) {
        const encoded = elements.map(elem => `${elem.length}.${elem}`).join(',');
        return `${encoded};`;
    }

    /**
     * Decode Guacamole protocol instruction
     */
    static decodeInstruction(instruction) {
        if (!instruction.endsWith(';')) return null;

        const elements = [];
        const parts = instruction.slice(0, -1).split(',');

        for (const part of parts) {
            const dotIndex = part.indexOf('.');
            if (dotIndex === -1) continue;

            const length = parseInt(part.substring(0, dotIndex));
            const content = part.substring(dotIndex + 1);

            if (content.length >= length) {
                elements.push(content.substring(0, length));
            }
        }

        return elements;
    }

    /**
     * Send instruction to server
     */
    send(...elements) {
        const instruction = GuacamoleClient.encodeInstruction(...elements);
        this.websocket.send(instruction);
    }

    /**
     * Handle incoming data from WebSocket
     */
    handleData(data) {
        this.buffer += data;

        // Process all complete instructions in buffer
        let semicolonIndex;
        while ((semicolonIndex = this.buffer.indexOf(';')) !== -1) {
            const instruction = this.buffer.substring(0, semicolonIndex + 1);
            this.buffer = this.buffer.substring(semicolonIndex + 1);

            const elements = GuacamoleClient.decodeInstruction(instruction);
            if (elements && elements.length > 0 && this.oninstruction) {
                this.oninstruction(elements[0], elements.slice(1));
            }
        }
    }
}

/**
 * RDP Viewer Component using Guacamole protocol over WebSocket
 */
const RDPViewer = ({ profile, onClose }) => {
    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const clientRef = useRef(null);
    const [status, setStatus] = useState('connecting'); // connecting, connected, error, disconnected
    const [error, setError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!profile) return;

        // Get JWT token from Zustand persisted auth store
        const authData = localStorage.getItem('dallal-auth');
        let token = null;

        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                token = parsed.state?.token || parsed.token;
            } catch (e) {
                console.error('Failed to parse auth data:', e);
            }
        }

        if (!token) {
            setStatus('error');
            setError('Authentication token not found. Please log in again.');
            return;
        }

        // Construct WebSocket URL with token
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/api/v1/rdp/ws/${profile.id}?token=${token}`;

        console.log(`Connecting to RDP via WebSocket: ${wsUrl.replace(token, '***')}`); // Hide token in logs
        setStatus('connecting');

        // Create WebSocket connection
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Create Guacamole client
        const client = new GuacamoleClient(ws);
        clientRef.current = client;

        // Canvas context
        const canvas = canvasRef.current;
        const ctx = canvas ? canvas.getContext('2d') : null;

        // Track display layers
        const layers = new Map();
        const defaultLayer = { canvas, ctx, x: 0, y: 0 };
        layers.set(0, defaultLayer);

        // WebSocket event handlers
        ws.onopen = () => {
            console.log('WebSocket connected');
            setStatus('connected');

            // Send mouse and keyboard state
            // The actual RDP stream will be handled by guacd
        };

        ws.onmessage = (event) => {
            client.handleData(event.data);
        };

        ws.onerror = (event) => {
            console.error('WebSocket error:', event);
            setStatus('error');
            setError('Connection failed. Please check if the Guacamole server is running.');
        };

        ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            setStatus('disconnected');
            if (event.code === 1008) {
                setError(event.reason || 'Connection closed by server');
            }
        };

        // Handle Guacamole protocol instructions
        client.oninstruction = (opcode, args) => {
            switch (opcode) {
                case 'size':
                    // Layer resize: size,layer,width,height
                    if (args.length >= 3 && canvas) {
                        const width = parseInt(args[1]);
                        const height = parseInt(args[2]);
                        canvas.width = width;
                        canvas.height = height;
                        console.log(`Canvas resized to ${width}x${height}`);
                    }
                    break;

                case 'png':
                case 'jpeg':
                    // Image data: png/jpeg,layer,x,y,data
                    if (args.length >= 4) {
                        const layerId = parseInt(args[0]);
                        const x = parseInt(args[1]);
                        const y = parseInt(args[2]);
                        const data = args[3];

                        const layer = layers.get(layerId) || defaultLayer;

                        // Decode base64 image and draw to canvas
                        const img = new Image();
                        img.onload = () => {
                            if (layer.ctx) {
                                layer.ctx.drawImage(img, x, y);
                            }
                        };
                        img.src = `data:image/${opcode};base64,${data}`;
                    }
                    break;

                case 'copy':
                    // Copy region: copy,src_layer,src_x,src_y,width,height,dst_layer,dst_x,dst_y
                    if (args.length >= 8 && ctx) {
                        const srcX = parseInt(args[1]);
                        const srcY = parseInt(args[2]);
                        const width = parseInt(args[3]);
                        const height = parseInt(args[4]);
                        const dstX = parseInt(args[6]);
                        const dstY = parseInt(args[7]);

                        const imageData = ctx.getImageData(srcX, srcY, width, height);
                        ctx.putImageData(imageData, dstX, dstY);
                    }
                    break;

                case 'rect':
                    // Draw rectangle: rect,layer,x,y,width,height
                    if (args.length >= 5 && ctx) {
                        const x = parseInt(args[1]);
                        const y = parseInt(args[2]);
                        const width = parseInt(args[3]);
                        const height = parseInt(args[4]);
                        ctx.fillRect(x, y, width, height);
                    }
                    break;

                case 'error':
                    // Error message from server
                    const errorMsg = args.join(', ');
                    console.error('Guacamole error:', errorMsg);
                    setStatus('error');
                    setError(errorMsg || 'Remote desktop error');
                    break;

                case 'sync':
                    // Sync acknowledgement - send our own sync
                    if (args.length > 0) {
                        client.send('sync', args[0]);
                    }
                    break;

                default:
                    // Log unhandled opcodes for debugging
                    console.log(`Unhandled Guacamole opcode: ${opcode}`, args);
            }
        };

        // Mouse event handlers
        const handleMouseMove = (e) => {
            if (!canvas || !client) return;
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
            const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
            client.send('mouse', x.toString(), y.toString(), '0'); // 0 = no buttons pressed
        };

        const handleMouseDown = (e) => {
            if (!canvas || !client) return;
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
            const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

            // Button mask: 1=left, 2=middle, 4=right
            const button = e.button === 0 ? 1 : e.button === 1 ? 2 : 4;
            client.send('mouse', x.toString(), y.toString(), button.toString());
        };

        const handleMouseUp = (e) => {
            if (!canvas || !client) return;
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
            const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
            client.send('mouse', x.toString(), y.toString(), '0');
        };

        // Keyboard event handlers
        const handleKeyDown = (e) => {
            if (!client) return;
            e.preventDefault();
            const keysym = getKeysym(e.key, e.keyCode);
            if (keysym) {
                client.send('key', keysym.toString(), '1'); // 1 = pressed
            }
        };

        const handleKeyUp = (e) => {
            if (!client) return;
            e.preventDefault();
            const keysym = getKeysym(e.key, e.keyCode);
            if (keysym) {
                client.send('key', keysym.toString(), '0'); // 0 = released
            }
        };

        // Attach event listeners
        if (canvas) {
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mousedown', handleMouseDown);
            canvas.addEventListener('mouseup', handleMouseUp);
            canvas.tabIndex = 0; // Make canvas focusable
            canvas.addEventListener('keydown', handleKeyDown);
            canvas.addEventListener('keyup', handleKeyUp);
            canvas.focus();
        }

        // Cleanup
        return () => {
            if (canvas) {
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.removeEventListener('mousedown', handleMouseDown);
                canvas.removeEventListener('mouseup', handleMouseUp);
                canvas.removeEventListener('keydown', handleKeyDown);
                canvas.removeEventListener('keyup', handleKeyUp);
            }
            if (ws) {
                ws.close();
            }
        };
    }, [profile]);

    // Simple keysym mapping (basic implementation)
    const getKeysym = (key, keyCode) => {
        // X11 keysym values
        const keysymMap = {
            'Backspace': 0xFF08,
            'Tab': 0xFF09,
            'Enter': 0xFF0D,
            'Escape': 0xFF1B,
            'Delete': 0xFFFF,
            'Home': 0xFF50,
            'Left': 0xFF51,
            'Up': 0xFF52,
            'Right': 0xFF53,
            'Down': 0xFF54,
            'PageUp': 0xFF55,
            'PageDown': 0xFF56,
            'End': 0xFF57,
            'Insert': 0xFF63,
            'Shift': 0xFFE1,
            'Control': 0xFFE3,
            'Alt': 0xFFE9,
            'CapsLock': 0xFFE5,
        };

        if (keysymMap[key]) {
            return keysymMap[key];
        }

        // For printable characters, use Unicode value
        if (key.length === 1) {
            return key.charCodeAt(0);
        }

        return null;
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.95)',
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header */}
            <div style={{
                background: 'var(--card-bg)',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>{profile.name}</h3>
                    <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        background: status === 'connected' ? 'rgba(16, 185, 129, 0.2)' : status === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: status === 'connected' ? '#10b981' : status === 'error' ? '#ef4444' : 'var(--accent)'
                    }}>
                        {status === 'connecting' && <><Loader size={12} className="spin" style={{ display: 'inline', marginRight: '0.25rem' }} /> Connecting...</>}
                        {status === 'connected' && '● Connected'}
                        {status === 'error' && <><AlertCircle size={12} style={{ display: 'inline', marginRight: '0.25rem' }} /> Error</>}
                        {status === 'disconnected' && 'Disconnected'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn"
                        onClick={toggleFullscreen}
                        style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--accent)',
                            border: '1px solid var(--accent)',
                            padding: '0.5rem'
                        }}
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button
                        className="btn"
                        onClick={onClose}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            padding: '0.5rem'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Canvas Container */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                background: '#000'
            }}>
                {error ? (
                    <Card style={{ maxWidth: '500px', background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}>
                        <div style={{ textAlign: 'center' }}>
                            <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
                            <h3 style={{ color: '#ef4444', marginTop: 0 }}>Connection Error</h3>
                            <p style={{ color: '#ef4444' }}>{error}</p>
                            <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '1rem' }}>
                                Close
                            </button>
                        </div>
                    </Card>
                ) : (
                    <canvas
                        ref={canvasRef}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            border: '1px solid var(--border)',
                            cursor: status === 'connected' ? 'default' : 'wait',
                            outline: 'none'
                        }}
                        width={1920}
                        height={1080}
                    />
                )}
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default RDPViewer;

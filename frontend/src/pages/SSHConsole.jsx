import React, { useEffect, useRef, useState } from 'react';
import { api, BASE_URL } from '../lib/api';
import Card from '../components/ui/Card';
import { Terminal as TerminalIcon, Play } from 'lucide-react';

const SSH = () => {
    const terminalRef = useRef(null);
    const wsRef = useRef(null);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [connected, setConnected] = useState(false);
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const [connectionLogs, setConnectionLogs] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('connecting');

    useEffect(() => {
        api.get('/services/')
            .then(res => setServices(res.data))
            .catch(err => console.error(err));

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const addLog = (message, type = 'info') => {
        setConnectionLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
    };

    const connectSSH = async () => {
        if (!selectedService || !credentials.username || !credentials.password) return;

        // Show modal
        setShowConnectionModal(true);
        setConnectionLogs([]);
        setConnectionStatus('connecting');
        addLog('Initializing SSH connection...');

        try {
            // Dynamically load xterm
            addLog('Loading terminal library...');
            const xtermModule = await import('xterm');
            const fitModule = await import('xterm-addon-fit');

            // Import CSS
            await import('xterm/css/xterm.css');

            const Terminal = xtermModule.Terminal;
            const FitAddon = fitModule.FitAddon;

            addLog('Terminal library loaded', 'success');

            const term = new Terminal({
                cursorBlink: true,
                theme: {
                    background: '#0d1117',
                    foreground: '#c9d1d9'
                },
                fontFamily: 'monospace'
            });

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);

            if (terminalRef.current) {
                terminalRef.current.innerHTML = '';
            }
            term.open(terminalRef.current);
            fitAddon.fit();

            addLog(`Connecting to ${selectedService.name} (${selectedService.ip})...`);
            term.writeln('Connecting to ' + selectedService.name + '...');

            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = BASE_URL.replace(/^https?:\/\//, '');
            const wsUrl = `${wsProtocol}//${host}/ws/ssh/${selectedService.id}`;

            addLog('Establishing WebSocket connection...');
            const socket = new WebSocket(wsUrl);
            wsRef.current = socket;

            socket.onopen = () => {
                addLog('WebSocket connected', 'success');
                term.writeln('Connection established. Authenticating...');
                addLog('Sending credentials...');
                socket.send(JSON.stringify(credentials));
                setConnected(true);

                setTimeout(() => {
                    setConnectionStatus('success');
                    addLog('SSH session established!', 'success');
                    setTimeout(() => setShowConnectionModal(false), 1500);
                }, 500);
            };

            socket.onmessage = (event) => {
                term.write(event.data);
            };

            socket.onclose = (e) => {
                term.writeln('\r\nConnection closed: ' + e.code);
                setConnected(false);

                if (connectionStatus === 'connecting') {
                    setConnectionStatus('failed');
                    addLog(`Connection closed: ${e.code}`, 'error');
                    setTimeout(() => setShowConnectionModal(false), 3000);
                }
            };

            socket.onerror = (err) => {
                term.writeln('\r\nWebSocket Error.');
                console.error(err);
                setConnectionStatus('failed');
                addLog('Connection failed', 'error');
                setTimeout(() => setShowConnectionModal(false), 3000);
            };

            term.onData(data => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(data);
                }
            });

        } catch (error) {
            console.error('Failed to load terminal:', error);
            setConnectionStatus('failed');
            addLog(`Failed to load terminal: ${error.message}`, 'error');
            setTimeout(() => setShowConnectionModal(false), 3000);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !connected) connectSSH();
    };

    return (
        <div style={{ padding: '1rem', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            <h1 className="page-title"><TerminalIcon style={{ marginRight: '10px' }} /> SSH Terminal</h1>

            {!connected ? (
                <div style={{ maxWidth: '500px', margin: 'auto', width: '100%' }}>
                    <Card title="New Connection">
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Server</label>
                            <select
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', borderRadius: '6px', color: 'white' }}
                                value={selectedService?.id || ''}
                                onChange={e => {
                                    const s = services.find(x => x.id === parseInt(e.target.value));
                                    setSelectedService(s);
                                    if (s && s.ssh_username) {
                                        setCredentials({
                                            username: s.ssh_username || '',
                                            password: s.ssh_password || ''
                                        });
                                    }
                                }}
                            >
                                <option value="">Select a service...</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.ip})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Username</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', borderRadius: '6px', color: 'white' }}
                                value={credentials.username}
                                onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                                onKeyDown={handleKey}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label>Password</label>
                            <input
                                type="password"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', borderRadius: '6px', color: 'white' }}
                                value={credentials.password}
                                onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                onKeyDown={handleKey}
                            />
                        </div>

                        <button
                            className="btn primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={connectSSH}
                            disabled={!selectedService || !credentials.username}
                        >
                            <Play size={16} style={{ marginRight: '8px' }} /> Connect
                        </button>
                    </Card>
                </div>
            ) : (
                <div style={{ flex: 1, background: '#0d1117', borderRadius: '8px', padding: '1rem', border: '1px solid #333', position: 'relative' }}>
                    <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
                    <button
                        onClick={() => {
                            wsRef.current?.close();
                            setConnected(false);
                        }}
                        style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Disconnect
                    </button>
                </div>
            )}

            {/* Connection Modal */}
            {showConnectionModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <Card style={{
                        width: '90%',
                        maxWidth: '500px',
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {connectionStatus === 'connecting' && (
                                <>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        border: '3px solid rgba(59, 130, 246, 0.3)',
                                        borderTop: '3px solid var(--accent)',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    <h3 style={{ margin: 0, color: 'var(--accent)' }}>Connecting to SSH...</h3>
                                </>
                            )}
                            {connectionStatus === 'success' && (
                                <>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        background: 'var(--success)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}>✓</div>
                                    <h3 style={{ margin: 0, color: 'var(--success)' }}>Connected Successfully!</h3>
                                </>
                            )}
                            {connectionStatus === 'failed' && (
                                <>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        background: 'var(--danger)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}>✕</div>
                                    <h3 style={{ margin: 0, color: 'var(--danger)' }}>Connection Failed</h3>
                                </>
                            )}
                        </div>

                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '6px',
                            padding: '1rem',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem'
                        }}>
                            {connectionLogs.map((log, index) => (
                                <div key={index} style={{
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    gap: '0.5rem',
                                    color: log.type === 'error' ? 'var(--danger)' : log.type === 'success' ? 'var(--success)' : 'var(--text-secondary)'
                                }}>
                                    <span style={{ opacity: 0.5 }}>[{log.timestamp.toLocaleTimeString()}]</span>
                                    <span>{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default SSH;

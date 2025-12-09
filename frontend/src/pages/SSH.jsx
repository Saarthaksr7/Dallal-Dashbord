import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { api, BASE_URL } from '../lib/api';
import Card from '../components/ui/Card';
import { Terminal as TerminalIcon, Search, Lock, Play } from 'lucide-react';

const SSH = () => {
    const terminalRef = useRef(null);
    const wsRef = useRef(null);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [connected, setConnected] = useState(false);
    const [termInstance, setTermInstance] = useState(null);

    useEffect(() => {
        // Fetch services with SSH capability or just all TCP services
        api.get('/services/')
            .then(res => setServices(res.data))
            .catch(err => console.error(err));

        return () => {
            // Cleanup
            if (wsRef.current) wsRef.current.close();
            if (termInstance) termInstance.dispose();
        };
    }, []);

    const connectSSH = () => {
        if (!selectedService || !credentials.username || !credentials.password) return;

        // Initialize xterm
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

        // Clear previous content
        if (terminalRef.current) {
            terminalRef.current.innerHTML = '';
        }
        term.open(terminalRef.current);
        fitAddon.fit();
        setTermInstance(term);

        term.writeln('Connecting to ' + selectedService.name + '...');

        // WebSocket
        // Replace http/https with ws/wss
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Allow BASE_URL to dictate host, but we need to strip http://
        const host = BASE_URL.replace(/^https?:\/\//, '');
        const wsUrl = `${wsProtocol}//${host}/ws/ssh/${selectedService.id}`;

        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
            term.writeln('Connection established. Authenticating...');
            // Send Credentials
            socket.send(JSON.stringify(credentials));
            setConnected(true);
        };

        socket.onmessage = (event) => {
            term.write(event.data);
        };

        socket.onclose = (e) => {
            term.writeln('\r\nConnection closed: ' + e.code);
            setConnected(false);
        };

        socket.onerror = (err) => {
            term.writeln('\r\nWebSocket Error.');
            console.error(err);
        };

        // User Input -> WS
        term.onData(data => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(data);
            }
        });

        // Handle Resize ?? (Need backend support for window size, skip for now MVP)
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
                                    // Pre-fill username if we had it stored? For now blank.
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
        </div>
    );
};

export default SSH;

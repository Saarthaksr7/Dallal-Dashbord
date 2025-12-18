import React, { useEffect, useRef, useState } from 'react';
import { BASE_URL } from '../lib/api';
import Card from '../components/ui/Card';
import { Terminal as TerminalIcon, Play, Save, Trash2, ServerCog } from 'lucide-react';
import TerminalToolbar from '../components/ssh/TerminalToolbar';
import CustomCommandsMenu from '../components/ssh/CustomCommandsMenu';
import ConnectionModal from '../components/ssh/ConnectionModal';
import DisconnectModal from '../components/ssh/DisconnectModal';

const CustomSSH = () => {
    const wsRef = useRef(null);
    const [terminalOutput, setTerminalOutput] = useState([]);
    const [currentCommand, setCurrentCommand] = useState('');
    const outputEndRef = useRef(null);
    const [connectionDetails, setConnectionDetails] = useState({
        host: '',
        port: '22',
        username: '',
        password: ''
    });
    const [savedConnections, setSavedConnections] = useState([]);
    const [connected, setConnected] = useState(false);
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const [connectionLogs, setConnectionLogs] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [saveConnectionName, setSaveConnectionName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showCommandsMenu, setShowCommandsMenu] = useState(false);
    const [showNewConnectionModal, setShowNewConnectionModal] = useState(false);
    const [showDisconnectModal, setShowDisconnectModal] = useState(false);
    const [splitMode, setSplitMode] = useState(false);

    // Load saved connections from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('customSSHConnections');
        if (saved) {
            setSavedConnections(JSON.parse(saved));
        }

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const addLog = (message, type = 'info') => {
        setConnectionLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
    };

    const addOutput = (text, type = 'output') => {
        setTerminalOutput(prev => [...prev, { text, type, timestamp: Date.now() }]);
    };

    const connectSSH = async (details = connectionDetails) => {
        if (!details.host || !details.username || !details.password) {
            alert('Please fill in all required fields');
            return;
        }

        // Show modal
        setShowConnectionModal(true);
        setConnectionLogs([]);
        setConnectionStatus('connecting');
        addLog('Initializing SSH connection...');

        try {
            addLog('Connecting to server...');
            setTerminalOutput([]);
            addOutput(`Connecting to ${details.host}:${details.port}...`, 'info');

            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = BASE_URL.replace(/^https?:\/\//, '');
            const wsUrl = `${wsProtocol}//${host}/ws/ssh/custom`;

            addLog('Establishing WebSocket connection...');
            const socket = new WebSocket(wsUrl);
            wsRef.current = socket;

            socket.onopen = () => {
                addLog('WebSocket connected', 'success');
                addOutput('Connection established. Authenticating...', 'info');
                addLog('Sending credentials...');
                socket.send(JSON.stringify({
                    host: details.host,
                    port: parseInt(details.port),
                    username: details.username,
                    password: details.password
                }));
                setConnected(true);

                setTimeout(() => {
                    setConnectionStatus('success');
                    addLog('SSH session established!', 'success');
                    setTimeout(() => setShowConnectionModal(false), 1500);
                }, 500);
            };

            socket.onmessage = (event) => {
                addOutput(event.data);
            };

            socket.onclose = (e) => {
                addOutput(`\r\nConnection closed: ${e.code}`, 'error');
                setConnected(false);

                if (connectionStatus === 'connecting') {
                    setConnectionStatus('failed');
                    addLog(`Connection closed: ${e.code}`, 'error');
                    setTimeout(() => setShowConnectionModal(false), 3000);
                }
            };

            socket.onerror = (err) => {
                addOutput('\r\nWebSocket Error.', 'error');
                console.error(err);
                setConnectionStatus('failed');
                addLog('Connection failed', 'error');
                setTimeout(() => setShowConnectionModal(false), 3000);
            };

        } catch (error) {
            console.error('Failed to connect:', error);
            setConnectionStatus('failed');
            addLog(`Failed to connect: ${error.message}`, 'error');
            setTimeout(() => setShowConnectionModal(false), 3000);
        }
    };

    const sendCommand = () => {
        if (!currentCommand.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        addOutput(`$ ${currentCommand}`, 'command');
        wsRef.current.send(currentCommand + '\n');

        // Log command to history
        try {
            const settings = JSON.parse(localStorage.getItem('sshSettings') || '{}');
            const historyEnabled = settings.history?.enabled !== false;

            if (historyEnabled) {
                const history = JSON.parse(localStorage.getItem('commandHistory') || '[]');
                const newEntry = {
                    id: Date.now(),
                    command: currentCommand,
                    timestamp: new Date().toISOString(),
                    service: connectionDetails.host || 'Custom SSH',
                    serviceIp: `${connectionDetails.host}:${connectionDetails.port}`,
                    user: connectionDetails.username || '',
                    result: 'success',
                    duration: null
                };
                history.push(newEntry);

                // Keep only max entries
                const maxEntries = settings.history?.maxEntries || 1000;
                if (history.length > maxEntries) {
                    history.splice(0, history.length - maxEntries);
                }
                localStorage.setItem('commandHistory', JSON.stringify(history));
            }
        } catch (err) {
            console.error('Failed to save command history:', err);
        }

        setCurrentCommand('');
    };

    const handleNewConnection = () => {
        setShowNewConnectionModal(true);
    };

    const handleDisconnect = () => {
        setShowDisconnectModal(true);
    };

    const handleConnectionChoice = ({ type, mode }) => {
        if (mode === 'tab') {
            const url = type === 'custom' ? '/ssh/custom' : '/ssh/console';
            window.open(url, '_blank');
        } else {
            // Split mode - reset for new connection
            setTerminalOutput([]);
            setConnected(false);
            if (wsRef.current) wsRef.current.close();
        }
    };

    const handleSaveSession = (sessionName) => {
        const session = {
            id: Date.now(),
            name: sessionName,
            connectionDetails,
            history: terminalOutput,
            timestamp: new Date().toISOString()
        };

        const saved = JSON.parse(localStorage.getItem('sshSessions') || '[]');
        saved.push(session);
        localStorage.setItem('sshSessions', JSON.stringify(saved));

        if (wsRef.current) wsRef.current.close();
        setConnected(false);
    };

    const handleQuitSession = () => {
        if (wsRef.current) wsRef.current.close();
        setConnected(false);
    };

    const handleOpenTab = () => {
        if (!connectionDetails.host) return;
        const url = `/ssh/custom?host=${connectionDetails.host}&port=${connectionDetails.port}&username=${connectionDetails.username}`;
        window.open(url, '_blank');
    };

    const handleSplit = () => {
        setSplitMode(!splitMode);
        if (!splitMode) {
            addOutput('\r\n=== Split View Mode ===', 'info');
            addOutput('Split view allows multiple terminals side-by-side.', 'info');
            addOutput('Currently showing UI demo. Full multi-WebSocket support coming soon!', 'info');
            addOutput('Click Split again to toggle back to single view.\r\n', 'info');
        }
    };

    const handleCustomCommand = () => {
        setShowCommandsMenu(true);
    };

    const executeCustomCommand = (code) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(code);
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalOutput]);

    const saveConnection = () => {
        if (!saveConnectionName.trim()) {
            alert('Please enter a name for this connection');
            return;
        }

        const newConnection = {
            id: Date.now(),
            name: saveConnectionName,
            ...connectionDetails
        };

        const updated = [...savedConnections, newConnection];
        setSavedConnections(updated);
        localStorage.setItem('customSSHConnections', JSON.stringify(updated));
        setShowSaveDialog(false);
        setSaveConnectionName('');
    };

    const deleteConnection = (id) => {
        if (confirm('Are you sure you want to delete this saved connection?')) {
            const updated = savedConnections.filter(conn => conn.id !== id);
            setSavedConnections(updated);
            localStorage.setItem('customSSHConnections', JSON.stringify(updated));
        }
    };

    const loadConnection = (conn) => {
        setConnectionDetails({
            host: conn.host,
            port: conn.port,
            username: conn.username,
            password: conn.password
        });
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !connected) connectSSH();
    };

    return (
        <div style={{ padding: '1rem', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <ServerCog size={24} />
                <h2 style={{ margin: 0 }}>Custom SSH Connection</h2>
            </div>

            {!connected ? (
                <div style={{ display: 'grid', gridTemplateColumns: savedConnections.length > 0 ? '1fr 1fr' : '1fr', gap: '2rem', maxWidth: '1200px' }}>
                    {/* Connection Form */}
                    <Card title="New Connection">
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Host / IP Address *</label>
                            <input
                                type="text"
                                placeholder="192.168.1.100 or example.com"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', borderRadius: '6px', color: 'white' }}
                                value={connectionDetails.host}
                                onChange={e => setConnectionDetails({ ...connectionDetails, host: e.target.value })}
                                onKeyDown={handleKey}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Port</label>
                            <input
                                type="number"
                                placeholder="22"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', borderRadius: '6px', color: 'white' }}
                                value={connectionDetails.port}
                                onChange={e => setConnectionDetails({ ...connectionDetails, port: e.target.value })}
                                onKeyDown={handleKey}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Username *</label>
                            <input
                                type="text"
                                placeholder="root"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', borderRadius: '6px', color: 'white' }}
                                value={connectionDetails.username}
                                onChange={e => setConnectionDetails({ ...connectionDetails, username: e.target.value })}
                                onKeyDown={handleKey}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label>Password *</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', borderRadius: '6px', color: 'white' }}
                                value={connectionDetails.password}
                                onChange={e => setConnectionDetails({ ...connectionDetails, password: e.target.value })}
                                onKeyDown={handleKey}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn primary"
                                style={{ flex: 1, justifyContent: 'center' }}
                                onClick={() => connectSSH()}
                                disabled={!connectionDetails.host || !connectionDetails.username || !connectionDetails.password}
                            >
                                <Play size={16} style={{ marginRight: '8px' }} /> Connect
                            </button>
                            <button
                                className="btn"
                                style={{ justifyContent: 'center' }}
                                onClick={() => setShowSaveDialog(true)}
                                disabled={!connectionDetails.host || !connectionDetails.username}
                            >
                                <Save size={16} />
                            </button>
                        </div>
                    </Card>

                    {/* Saved Connections */}
                    {savedConnections.length > 0 && (
                        <Card title="Saved Connections">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {savedConnections.map(conn => (
                                    <div
                                        key={conn.id}
                                        style={{
                                            padding: '1rem',
                                            background: 'rgba(0,0,0,0.3)',
                                            borderRadius: '6px',
                                            border: '1px solid #333',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{conn.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {conn.username}@{conn.host}:{conn.port}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn primary"
                                                style={{ padding: '0.5rem 1rem' }}
                                                onClick={() => {
                                                    loadConnection(conn);
                                                    connectSSH(conn);
                                                }}
                                            >
                                                <Play size={14} style={{ marginRight: '4px' }} /> Connect
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ padding: '0.5rem 1rem' }}
                                                onClick={() => loadConnection(conn)}
                                            >
                                                Load
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ padding: '0.5rem', color: 'var(--danger)' }}
                                                onClick={() => deleteConnection(conn.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d1117', borderRadius: '8px', border: '1px solid #333', position: 'relative', overflow: 'hidden' }}>
                    <TerminalToolbar
                        connected={connected}
                        onNewConnection={handleNewConnection}
                        onDisconnect={handleDisconnect}
                        onOpenTab={handleOpenTab}
                        onSplit={handleSplit}
                        onCustomCommand={handleCustomCommand}
                    />

                    {/* Split Mode Indicator */}
                    {splitMode && (
                        <div style={{
                            position: 'absolute',
                            top: '60px',
                            right: '10px',
                            background: '#10b981',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            zIndex: 10,
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}>
                            🔀 Split Mode Active
                        </div>
                    )}

                    {/* Terminal Output */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1rem',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        color: '#c9d1d9',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                    }}>
                        {terminalOutput.map((item, index) => (
                            <div key={index} style={{
                                marginBottom: '2px',
                                color: item.type === 'command' ? '#4a9eff' : item.type === 'error' ? '#ff6b6b' : item.type === 'info' ? '#ffd93d' : '#c9d1d9'
                            }}>
                                {item.text}
                            </div>
                        ))}
                        <div ref={outputEndRef} />
                    </div>

                    {/* Command Input */}
                    <div style={{
                        borderTop: '1px solid #333',
                        padding: '1rem',
                        display: 'flex',
                        gap: '0.5rem',
                        background: '#0d1117'
                    }}>
                        <span style={{ color: '#4a9eff', fontFamily: 'monospace' }}>$</span>
                        <input
                            type="text"
                            value={currentCommand}
                            onChange={(e) => setCurrentCommand(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') sendCommand();
                            }}
                            placeholder="Type command here..."
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: '#c9d1d9',
                                fontFamily: 'monospace',
                                fontSize: '14px'
                            }}
                            autoFocus
                        />
                    </div>
                </div>
            )}

            {/* Save Connection Dialog */}
            {showSaveDialog && (
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
                        maxWidth: '400px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)'
                    }}>
                        <h3 style={{ marginTop: 0 }}>Save Connection</h3>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Connection Name</label>
                            <input
                                type="text"
                                placeholder="My Server"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', borderRadius: '6px', color: 'white' }}
                                value={saveConnectionName}
                                onChange={e => setSaveConnectionName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveConnection()}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn"
                                onClick={() => {
                                    setShowSaveDialog(false);
                                    setSaveConnectionName('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn primary"
                                onClick={saveConnection}
                            >
                                Save
                            </button>
                        </div>
                    </Card>
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

            {/* Custom Commands Menu */}
            <CustomCommandsMenu
                isOpen={showCommandsMenu}
                onClose={() => setShowCommandsMenu(false)}
                onExecute={executeCustomCommand}
            />

            {/* Connection Modal */}
            <ConnectionModal
                isOpen={showNewConnectionModal}
                onClose={() => setShowNewConnectionModal(false)}
                onConnect={handleConnectionChoice}
            />

            {/* Disconnect Modal */}
            <DisconnectModal
                isOpen={showDisconnectModal}
                onClose={() => setShowDisconnectModal(false)}
                onSave={handleSaveSession}
                onQuit={handleQuitSession}
            />

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default CustomSSH;

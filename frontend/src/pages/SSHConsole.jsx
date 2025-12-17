import React, { useEffect, useRef, useState } from 'react';
import { api, BASE_URL } from '../lib/api';
import Card from '../components/ui/Card';
import Toast from '../components/ui/Toast';
import { Terminal as TerminalIcon, Play } from 'lucide-react';
import TerminalToolbar from '../components/ssh/TerminalToolbar';
import CustomCommandsMenu from '../components/ssh/CustomCommandsMenu';
import ConnectionModal from '../components/ssh/ConnectionModal';
import DisconnectModal from '../components/ssh/DisconnectModal';
import RestoreSessionModal from '../components/ssh/RestoreSessionModal';
import SplitTerminalView from '../components/ssh/SplitTerminalView';
import SplitPaneConnectionModal from '../components/ssh/SplitPaneConnectionModal';

const SSH = () => {
    const wsRef = useRef(null);
    const outputEndRef = useRef(null);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [connected, setConnected] = useState(false);
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const [connectionLogs, setConnectionLogs] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [terminalOutput, setTerminalOutput] = useState([]);
    const [currentCommand, setCurrentCommand] = useState('');
    const [showTerminal, setShowTerminal] = useState(false);
    const [showCommandsMenu, setShowCommandsMenu] = useState(false);
    const [showNewConnectionModal, setShowNewConnectionModal] = useState(false);
    const [showDisconnectModal, setShowDisconnectModal] = useState(false);
    const [splitMode, setSplitMode] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [restoredSession, setRestoredSession] = useState(null);
    const [pendingAutoConnect, setPendingAutoConnect] = useState(false);

    // Split view terminals state
    const [terminals, setTerminals] = useState([]);
    const terminalRefs = useRef({});  // Store WebSocket refs for each terminal
    const [showSplitPaneModal, setShowSplitPaneModal] = useState(false);

    // Toast notifications for connection feedback
    const [toast, setToast] = useState(null);

    const addOutput = (text, type = 'output') => {
        setTerminalOutput(prev => [...prev, { text, type, timestamp: Date.now() }]);
    };

    useEffect(() => {
        api.get('/services/')
            .then(res => setServices(res.data))
            .catch(err => console.error(err));

        // Check for restore parameter
        const urlParams = new URLSearchParams(window.location.search);
        const restoreId = urlParams.get('restore');
        if (restoreId) {
            const sessions = JSON.parse(localStorage.getItem('sshSessions') || '[]');
            const session = sessions.find(s => s.id === parseInt(restoreId) || s.id === restoreId);
            if (session) {
                // Show restore modal with options
                setRestoredSession(session);
                setShowRestoreModal(true);
            }
        }

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalOutput]);

    const addLog = (message, type = 'info') => {
        setConnectionLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
    };

    // Auto-connect when pendingAutoConnect is set and service/credentials are ready
    useEffect(() => {
        if (pendingAutoConnect && selectedService && credentials.username && credentials.password) {
            setPendingAutoConnect(false);
            connectSSH();
        }
    }, [pendingAutoConnect, selectedService, credentials]);

    // Handle "View History Only" option
    const handleShowHistory = () => {
        if (restoredSession) {
            if (restoredSession.service) {
                setSelectedService(restoredSession.service);
            }
            if (restoredSession.history && restoredSession.history.length > 0) {
                setTerminalOutput([
                    ...restoredSession.history,
                    { text: `--- Session "${restoredSession.name}" (View Only) ---`, type: 'info', timestamp: Date.now() }
                ]);
                setShowTerminal(true);
            }
        }
        setShowRestoreModal(false);
    };

    // Handle "Continue Session" option - restore history AND connect
    const handleContinueSession = () => {
        if (restoredSession) {
            if (restoredSession.service) {
                setSelectedService(restoredSession.service);
            }
            if (restoredSession.credentials) {
                setCredentials(restoredSession.credentials);
            }
            if (restoredSession.history && restoredSession.history.length > 0) {
                setTerminalOutput([
                    ...restoredSession.history,
                    { text: `--- Reconnecting "${restoredSession.name}" ---`, type: 'info', timestamp: Date.now() }
                ]);
            }
            // Close modal and trigger auto-connect via useEffect
            setShowRestoreModal(false);
            setPendingAutoConnect(true);
        }
    };


    const connectSSH = async () => {
        if (!selectedService) {
            alert('Please select a service');
            return;
        }

        // Show modal
        setShowConnectionModal(true);
        setConnectionLogs([]);
        setConnectionStatus('connecting');
        addLog('Initializing SSH connection...');

        try {
            addLog('Connecting to server...');
            // Only clear terminal output if NOT restoring a session (preserve restored history)
            if (!restoredSession) {
                setTerminalOutput([]);
            }
            addOutput(`Connecting to ${selectedService.name} (${selectedService.ip})...`, 'info');

            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = BASE_URL.replace(/^https?:\/\//, '');
            const wsUrl = `${wsProtocol}//${host}/ws/ssh/${selectedService.id}`;

            addLog('Establishing WebSocket connection...');
            const socket = new WebSocket(wsUrl);
            wsRef.current = socket;

            socket.onopen = () => {
                addLog('WebSocket connected', 'success');
                addOutput('Connection established. Authenticating...', 'info');
                addLog('Sending credentials...');
                socket.send(JSON.stringify({
                    username: credentials.username,
                    password: credentials.password
                }));
                setConnected(true);
                setShowTerminal(true);

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
                addOutput(`\r\n\r\n=== Connection closed (code: ${e.code}) ===`, 'error');
                if (e.code === 1006) {
                    addOutput('Connection failed. Possible reasons:', 'error');
                    addOutput('- Wrong SSH credentials', 'error');
                    addOutput('- SSH server not reachable', 'error');
                    addOutput('- Network timeout', 'error');
                } else if (e.code !== 1000) {
                    addOutput('Connection closed unexpectedly', 'error');
                }
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
                    service: selectedService?.name || 'SSH Console',
                    serviceIp: selectedService?.ip || '',
                    user: credentials.username || '',
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


    const handleKey = (e) => {
        if (e.key === 'Enter' && !connected) connectSSH();
    };

    const handleNewConnection = () => {
        setShowNewConnectionModal(true);
    };

    const handleDisconnect = () => {
        setShowDisconnectModal(true);
    };

    const handleConnectionChoice = ({ type, mode }) => {
        if (mode === 'tab') {
            // Open in new tab
            const url = type === 'custom' ? '/ssh/custom' : '/ssh/console';
            window.open(url, '_blank');
        } else {
            // Split mode - keep terminal view visible but reset connection
            setTerminalOutput([]);
            // Don't hide terminal in split mode - we need toolbar visible!
            // setShowTerminal(false); // REMOVED - causes toolbar to disappear
            setConnected(false);
            if (wsRef.current) wsRef.current.close();
        }
    };

    const handleSaveSession = (sessionName) => {
        // Save to localStorage for now
        const session = {
            id: Date.now(),
            name: sessionName,
            service: selectedService,
            credentials,
            history: terminalOutput,
            timestamp: new Date().toISOString()
        };

        const saved = JSON.parse(localStorage.getItem('sshSessions') || '[]');
        saved.push(session);
        localStorage.setItem('sshSessions', JSON.stringify(saved));

        // Clear restored session reference and disconnect
        setRestoredSession(null);
        if (wsRef.current) wsRef.current.close();
        setConnected(false);
    };

    const handleUpdateSession = (sessionId, sessionName) => {
        // Update existing session in localStorage
        const saved = JSON.parse(localStorage.getItem('sshSessions') || '[]');
        const index = saved.findIndex(s => s.id === sessionId);

        if (index !== -1) {
            saved[index] = {
                ...saved[index],
                name: sessionName,
                service: selectedService,
                credentials,
                history: terminalOutput,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('sshSessions', JSON.stringify(saved));
        }

        // Clear restored session reference and disconnect
        setRestoredSession(null);
        if (wsRef.current) wsRef.current.close();
        setConnected(false);
    };

    const handleQuitSession = () => {
        setRestoredSession(null);
        if (wsRef.current) wsRef.current.close();
        setConnected(false);
    };

    const handleOpenTab = () => {
        if (!selectedService) return;
        const url = `/ssh/console?service=${selectedService.id}&username=${credentials.username}`;
        window.open(url, '_blank');
    };

    const handleSplit = () => {
        if (!splitMode) {
            // Entering split mode - initialize with current terminal if connected
            const initialTerminal = {
                id: Date.now(),
                name: selectedService ? `${selectedService.name}` : 'Terminal 1',
                output: [...terminalOutput],
                connected: connected,
                service: selectedService,
                credentials: credentials
            };
            // Store the current WebSocket reference for this terminal
            terminalRefs.current[initialTerminal.id] = wsRef.current;
            setTerminals([initialTerminal]);
            setSplitMode(true);
        } else {
            // Exiting split mode - close all split terminal connections except first
            terminals.forEach((terminal, index) => {
                if (index > 0 && terminalRefs.current[terminal.id]) {
                    terminalRefs.current[terminal.id].close();
                    delete terminalRefs.current[terminal.id];
                }
            });
            setTerminals([]);
            setSplitMode(false);
        }
    };

    // Add new terminal pane - show connection modal
    const handleAddTerminal = () => {
        if (terminals.length >= 4) return;
        setShowSplitPaneModal(true);
    };

    // Handle connection selection from split pane modal
    const handleSplitPaneConnect = (connectionData) => {
        const newTerminal = {
            id: Date.now(),
            name: connectionData.type === 'service'
                ? connectionData.service.name
                : `${connectionData.connectionDetails.host}:${connectionData.connectionDetails.port}`,
            output: [{ text: 'Connecting...', type: 'info', timestamp: Date.now() }],
            connected: false,
            service: connectionData.type === 'service' ? connectionData.service : null,
            credentials: connectionData.type === 'service'
                ? connectionData.credentials
                : {
                    username: connectionData.connectionDetails.username,
                    password: connectionData.connectionDetails.password
                },
            connectionDetails: connectionData.type === 'custom' ? connectionData.connectionDetails : null
        };

        setTerminals(prev => [...prev, newTerminal]);

        // Show loading toast
        const serviceName = connectionData.type === 'service'
            ? connectionData.service.name
            : `${connectionData.connectionDetails.host}:${connectionData.connectionDetails.port}`;
        setToast({ message: `Connecting to ${serviceName}...`, type: 'info' });

        // Auto-connect the new terminal
        if (connectionData.type === 'service') {
            connectTerminalPane(newTerminal.id, connectionData.service, connectionData.credentials);
        } else {
            // For custom SSH, we need to connect using custom details
            connectTerminalPaneCustom(newTerminal.id, connectionData.connectionDetails);
        }
    };

    // Close terminal pane
    const handleCloseTerminal = (terminalId) => {
        // Close WebSocket if exists
        if (terminalRefs.current[terminalId]) {
            terminalRefs.current[terminalId].close();
            delete terminalRefs.current[terminalId];
        }

        // If only one terminal left, exit split mode
        if (terminals.length <= 1) {
            setSplitMode(false);
            setTerminals([]);
            return;
        }

        setTerminals(prev => prev.filter(t => t.id !== terminalId));
    };

    // Send command to specific terminal
    const handleSendCommandToTerminal = (terminalId, command) => {
        const ws = terminalRefs.current[terminalId];
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(command + '\n');

            // Add command to that terminal's output
            setTerminals(prev => prev.map(t =>
                t.id === terminalId
                    ? { ...t, output: [...t.output, { text: `$ ${command}`, type: 'command', timestamp: Date.now() }] }
                    : t
            ));
        }
    };

    // Connect a specific terminal pane to SSH
    const connectTerminalPane = async (terminalId, service, creds) => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = BASE_URL.replace(/^https?:\/\//, '');
        const wsUrl = `${wsProtocol}//${host}/ws/ssh/${service.id}`;

        const ws = new WebSocket(wsUrl);
        terminalRefs.current[terminalId] = ws;

        // Add connecting message
        setTerminals(prev => prev.map(t =>
            t.id === terminalId
                ? { ...t, output: [...t.output, { text: `Connecting to ${service.name}...`, type: 'info', timestamp: Date.now() }] }
                : t
        ));

        ws.onopen = () => {
            ws.send(JSON.stringify({ username: creds.username, password: creds.password }));
            setTerminals(prev => prev.map(t =>
                t.id === terminalId
                    ? { ...t, connected: true, service, credentials: creds, name: service.name }
                    : t
            ));
            // Show success toast
            setToast({ message: `Connected to ${service.name} successfully!`, type: 'success' });
        };

        ws.onmessage = (event) => {
            setTerminals(prev => prev.map(t =>
                t.id === terminalId
                    ? { ...t, output: [...t.output, { text: event.data, type: 'output', timestamp: Date.now() }] }
                    : t
            ));
        };

        ws.onerror = () => {
            setTerminals(prev => prev.map(t =>
                t.id === terminalId
                    ? { ...t, output: [...t.output, { text: 'Connection error', type: 'error', timestamp: Date.now() }] }
                    : t
            ));
            // Show error toast
            setToast({ message: `Failed to connect to ${service.name}`, type: 'error' });
        };

        ws.onclose = () => {
            setTerminals(prev => prev.map(t =>
                t.id === terminalId
                    ? { ...t, connected: false, output: [...t.output, { text: 'Disconnected', type: 'info', timestamp: Date.now() }] }
                    : t
            ));
        };
    };

    // Connect a specific terminal pane to custom SSH (manual host/port)
    const connectTerminalPaneCustom = async (terminalId, connectionDetails) => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = BASE_URL.replace(/^https?:\/\//, '');
        // Custom SSH endpoint - requires backend support
        const wsUrl = `${wsProtocol}//${host}/ws/ssh/custom`;

        const ws = new WebSocket(wsUrl);
        terminalRefs.current[terminalId] = ws;

        // Add connecting message
        setTerminals(prev => prev.map(t =>
            t.id === terminalId
                ? { ...t, output: [...t.output, { text: `Connecting to ${connectionDetails.host}:${connectionDetails.port}...`, type: 'info', timestamp: Date.now() }] }
                : t
        ));

        ws.onopen = () => {
            // Send custom connection details to backend
            ws.send(JSON.stringify({
                host: connectionDetails.host,
                port: connectionDetails.port,
                username: connectionDetails.username,
                password: connectionDetails.password
            }));

            setTerminals(prev => prev.map(t =>
                t.id === terminalId
                    ? {
                        ...t,
                        connected: true,
                        name: `${connectionDetails.host}:${connectionDetails.port}`,
                        output: [...t.output, { text: 'Authenticating...', type: 'info', timestamp: Date.now() }]
                    }
                    : t
            ));
            // Show success toast
            setToast({ message: `Connected to ${connectionDetails.host}:${connectionDetails.port}`, type: 'success' });
        };

        ws.onmessage = (event) => {
            setTerminals(prev => prev.map(t =>
                t.id === terminalId
                    ? { ...t, output: [...t.output, { text: event.data, type: 'output', timestamp: Date.now() }] }
                    : t
            ));
        };

        ws.onerror = (error) => {
            console.error('Custom SSH WebSocket error:', error);
            setTerminals(prev => prev.map(t =>
                t.id === terminalId
                    ? { ...t, output: [...t.output, { text: 'Connection error - Check if custom SSH endpoint is available', type: 'error', timestamp: Date.now() }] }
                    : t
            ));
            // Show error toast
            setToast({ message: `Failed to connect to ${connectionDetails.host}:${connectionDetails.port}`, type: 'error' });
        };

        ws.onclose = (e) => {
            const closeMessage = e.code === 1006
                ? 'Connection failed - Backend may not support custom SSH endpoint'
                : 'Disconnected';

            setTerminals(prev => prev.map(t =>
                t.id === terminalId
                    ? { ...t, connected: false, output: [...t.output, { text: closeMessage, type: 'info', timestamp: Date.now() }] }
                    : t
            ));
        };
    };

    const handleCustomCommand = () => {
        setShowCommandsMenu(true);
    };

    const executeCustomCommand = (code) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(code);
        }
    };


    return (
        <div style={{ padding: '1rem', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            <h1 className="page-title"><TerminalIcon style={{ marginRight: '10px' }} /> SSH Terminal</h1>

            {!showTerminal ? (
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
                                            password: s.ssh_password || '' // Now decrypted by backend
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

                    {/* Conditional: Split View or Single Terminal */}
                    {splitMode && terminals.length > 0 ? (
                        <SplitTerminalView
                            terminals={terminals}
                            onAddTerminal={handleAddTerminal}
                            onCloseTerminal={handleCloseTerminal}
                            onSendCommand={(terminalId, command) => {
                                if (command) {
                                    handleSendCommandToTerminal(terminalId, command);
                                }
                            }}
                        />
                    ) : (
                        <>
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
                        </>
                    )}
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
                onUpdate={handleUpdateSession}
                onQuit={handleQuitSession}
                restoredSession={restoredSession}
            />

            {/* Restore Session Modal */}
            <RestoreSessionModal
                isOpen={showRestoreModal}
                session={restoredSession}
                onShowHistory={handleShowHistory}
                onContinue={handleContinueSession}
                onClose={() => setShowRestoreModal(false)}
            />

            {/* Split Pane Connection Modal */}
            <SplitPaneConnectionModal
                isOpen={showSplitPaneModal}
                onClose={() => setShowSplitPaneModal(false)}
                onConnect={handleSplitPaneConnect}
                services={services}
            />

            {/* Toast Notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
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

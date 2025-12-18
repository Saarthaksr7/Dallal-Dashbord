import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import { Monitor, Play, Server, Settings, Download, Power, RefreshCw, Trash2 } from 'lucide-react';
import { useServicesStore } from '../store/services';
import { useRDPStore } from '../store/rdp';

const RDPSessions = () => {
    const { t } = useTranslation();
    const services = useServicesStore((state) => state.services);
    const {
        sessions,
        loading,
        error,
        fetchSessions,
        createSession,
        connectSession,
        disconnectSession,
        deleteSession,
        clearError
    } = useRDPStore();

    const [selectedService, setSelectedService] = useState(null);
    const [credentials, setCredentials] = useState({ username: 'Administrator', password: '' });
    const [sessionName, setSessionName] = useState('');
    const [resolution, setResolution] = useState('1920x1080');
    const [colorDepth, setColorDepth] = useState(24);
    const [recordingEnabled, setRecordingEnabled] = useState(false);
    const [creating, setCreating] = useState(false);

    // Fetch sessions on mount
    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleCreateSession = async () => {
        if (!selectedService || !credentials.username || !credentials.password) {
            alert('Please fill in all required fields');
            return;
        }

        setCreating(true);
        try {
            const sessionData = {
                service_id: selectedService.id,
                host: selectedService.ip,
                port: 3389,
                username: credentials.username,
                password: credentials.password,
                session_name: sessionName || `${selectedService.name} - ${new Date().toLocaleString()}`,
                resolution: resolution,
                color_depth: parseInt(colorDepth),
                recording_enabled: recordingEnabled
            };

            const newSession = await createSession(sessionData);

            // Reset form
            setCredentials({ username: 'Administrator', password: '' });
            setSessionName('');
            setSelectedService(null);

            alert(`Session "${newSession.session_name}" created successfully!`);
        } catch (err) {
            // Error already set in store
        } finally {
            setCreating(false);
        }
    };

    const handleConnect = async (session) => {
        try {
            const result = await connectSession(session.id);
            alert(`Connecting to ${session.session_name}...`);
            // In production: Open RDP viewer or WebSocket connection
        } catch (err) {
            // Error already handled
        }
    };

    const handleDisconnect = async (session) => {
        if (!confirm(`Disconnect from "${session.session_name}"?`)) return;

        try {
            await disconnectSession(session.id);
            alert('Session disconnected');
        } catch (err) {
            // Error already handled
        }
    };

    const handleDelete = async (session) => {
        if (!confirm(`Delete session "${session.session_name}"? This cannot be undone.`)) return;

        try {
            await deleteSession(session.id);
            alert('Session deleted');
        } catch (err) {
            // Error already handled
        }
    };

    const generateRDP = (session) => {
        const content = `full address:s:${session.host}\nusername:s:${session.username}\nscreen mode id:i:2\nd esktopwidth:i:${session.resolution.split('x')[0]}\ndesktopheight:i:${session.resolution.split('x')[1]}\n`;
        const blob = new Blob([content], { type: 'application/x-rdp' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${session.session_name}.rdp`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatDuration = (startTime) => {
        if (!startTime) return 'N/A';
        const minutes = Math.floor((Date.now() - new Date(startTime).getTime()) / 60000);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'connected': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '#10b981' };
            case 'connecting': return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '#3b82f6' };
            case 'disconnected': return { bg: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', border: '#6b7280' };
            case 'error': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '#ef4444' };
            default: return { bg: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', border: '#6b7280' };
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Monitor size={28} style={{ color: 'var(--accent)' }} />
                        <h1 style={{ margin: 0 }}>{t('rdp.sessions.title')}</h1>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={fetchSessions}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                        Refresh
                    </button>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {t('rdp.sessions.subtitle')}
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <Card style={{ marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ef4444' }}>{error}</span>
                        <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                            ×
                        </button>
                    </div>
                </Card>
            )}

            {/* Connection Launcher */}
            <Card style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Play size={20} />
                    New RDP Connection
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Server
                        </label>
                        <select
                            className="input-field"
                            value={selectedService?.id || ''}
                            onChange={(e) => {
                                const service = services.find(s => s.id === parseInt(e.target.value));
                                setSelectedService(service);
                                if (service && !sessionName) {
                                    setSessionName(`${service.name} Session`);
                                }
                            }}
                        >
                            <option value="">Select a service...</option>
                            {services.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name} ({service.ip})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Session Name
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            placeholder="My RDP Session"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Username
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={credentials.username}
                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                            placeholder="Enter username"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            className="input-field"
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            placeholder="Enter password"
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <Settings size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                            Resolution
                        </label>
                        <select
                            className="input-field"
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                        >
                            <option value="1920x1080">1920 × 1080 (Full HD)</option>
                            <option value="1366x768">1366 × 768</option>
                            <option value="1280x720">1280 × 720 (HD)</option>
                            <option value="1024x768">1024 × 768</option>
                        </select>
                    </div>

                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Color Depth
                        </label>
                        <select
                            className="input-field"
                            value={colorDepth}
                            onChange={(e) => setColorDepth(e.target.value)}
                        >
                            <option value="32">32-bit (True Color)</option>
                            <option value="24">24-bit</option>
                            <option value="16">16-bit (High Color)</option>
                            <option value="8">8-bit (256 Colors)</option>
                        </select>
                    </div>

                    <div style={{ flex: '1', minWidth: '200px', display: 'flex', alignItems: 'flex-end' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={recordingEnabled}
                                onChange={(e) => setRecordingEnabled(e.target.checked)}
                            />
                            <span>Enable Recording</span>
                        </label>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleCreateSession}
                    disabled={!selectedService || !credentials.username || !credentials.password || creating}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Monitor size={16} />
                    {creating ? 'Creating Session...' : 'Create Session'}
                </button>
            </Card>

            {/* Active Sessions */}
            <h2 style={{ marginBottom: '1rem' }}>My Sessions ({sessions.length})</h2>

            {sessions.length === 0 ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <Monitor size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <p>No RDP sessions yet. Create one above to get started!</p>
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                    {sessions.map(session => {
                        const statusStyle = getStatusColor(session.status);
                        return (
                            <Card key={session.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Server size={18} style={{ color: 'var(--accent)' }} />
                                            {session.session_name}
                                        </h3>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                            {session.host}:{session.port}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '0.25rem 0.75rem',
                                        background: statusStyle.bg,
                                        color: statusStyle.color,
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        border: `1px solid ${statusStyle.border}`
                                    }}>
                                        {session.status.toUpperCase()}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>User: </span>
                                        <span style={{ fontFamily: 'monospace' }}>{session.username}</span>
                                    </div>
                                    {session.started_at && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Duration: </span>
                                            <span>{formatDuration(session.started_at)}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span style={{ color: 'var(--text-secondary)' }}>Resolution: </span>
                                        <span>{session.resolution}</span>
                                    </div>
                                    {session.recording_enabled && (
                                        <div style={{ marginTop: '0.5rem', color: '#ef4444' }}>
                                            ● Recording Enabled
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {session.status === 'disconnected' && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleConnect(session)}
                                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                                        >
                                            <Monitor size={14} style={{ marginRight: '0.25rem' }} />
                                            Connect
                                        </button>
                                    )}
                                    {session.status === 'connected' && (
                                        <button
                                            className="btn"
                                            onClick={() => handleDisconnect(session)}
                                            style={{
                                                flex: 1,
                                                justifyContent: 'center',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                border: '1px solid #ef4444',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            <Power size={14} style={{ marginRight: '0.25rem' }} />
                                            Disconnect
                                        </button>
                                    )}
                                    <button
                                        className="btn"
                                        onClick={() => generateRDP(session)}
                                        style={{
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            color: 'var(--accent)',
                                            border: '1px solid var(--accent)',
                                            fontSize: '0.85rem'
                                        }}
                                        title="Download .rdp file"
                                    >
                                        <Download size={14} />
                                    </button>
                                    {session.status === 'disconnected' && (
                                        <button
                                            className="btn"
                                            onClick={() => handleDelete(session)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                border: '1px solid #ef4444',
                                                fontSize: '0.85rem'
                                            }}
                                            title="Delete session"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

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

export default RDPSessions;

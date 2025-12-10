import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import { Monitor, Play, Server, Settings, Download, Power } from 'lucide-react';
import { useServicesStore } from '../store/services';

const RDPSessions = () => {
    const { t } = useTranslation();
    const services = useServicesStore((state) => state.services);
    const [selectedService, setSelectedService] = useState(null);
    const [credentials, setCredentials] = useState({ username: 'Administrator', password: '' });
    const [resolution, setResolution] = useState('1920x1080');
    const [colorDepth, setColorDepth] = useState('32');
    const [activeSessions, setActiveSessions] = useState([]);

    // Mock active sessions
    const mockSessions = [
        {
            id: 1,
            service: 'Windows Server 2019',
            serviceIp: '192.168.1.50',
            user: 'Administrator',
            startTime: new Date(Date.now() - 30 * 60000).toISOString(),
            status: 'connected',
            resolution: '1920x1080'
        },
        {
            id: 2,
            service: 'Development Desktop',
            serviceIp: '192.168.1.55',
            user: 'admin',
            startTime: new Date(Date.now() - 120 * 60000).toISOString(),
            status: 'connected',
            resolution: '1366x768'
        }
    ];

    const generateRDP = (service) => {
        const content = `full address:s:${service.ip}\nusername:s:${credentials.username}\nscreen mode id:i:2\ndesktopwidth:i:${resolution.split('x')[0]}\ndesktopheight:i:${resolution.split('x')[1]}\n`;
        const blob = new Blob([content], { type: 'application/x-rdp' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${service.name}.rdp`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleConnect = () => {
        if (!selectedService) return;

        // In production: Open RDP session via Guacamole
        console.log('Connecting to RDP:', selectedService.name);
        generateRDP(selectedService);
    };

    const handleDisconnect = (sessionId) => {
        console.log('Disconnect session:', sessionId);
        // In production: Call disconnect API
    };

    const formatDuration = (startTime) => {
        const minutes = Math.floor((Date.now() - new Date(startTime).getTime()) / 60000);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Monitor size={28} style={{ color: 'var(--accent)' }} />
                    <h1 style={{ margin: 0 }}>{t('rdp.sessions.title')}</h1>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {t('rdp.sessions.subtitle')}
                </p>
            </div>

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
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleConnect}
                        disabled={!selectedService || !credentials.username}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Monitor size={16} />
                        Connect
                    </button>
                    <button
                        className="btn"
                        onClick={() => selectedService && generateRDP(selectedService)}
                        disabled={!selectedService}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--accent)',
                            border: '1px solid var(--accent)'
                        }}
                    >
                        <Download size={16} />
                        Download .rdp File
                    </button>
                </div>
            </Card>

            {/* Active Sessions */}
            <h2 style={{ marginBottom: '1rem' }}>Active Sessions</h2>

            {mockSessions.length === 0 ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <Monitor size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <p>No active RDP sessions</p>
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                    {mockSessions.map(session => (
                        <Card key={session.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Server size={18} style={{ color: 'var(--accent)' }} />
                                        {session.service}
                                    </h3>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                        {session.serviceIp}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '0.25rem 0.75rem',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10b981',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    border: '1px solid #10b981'
                                }}>
                                    CONNECTED
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>User: </span>
                                    <span style={{ fontFamily: 'monospace' }}>{session.user}</span>
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Duration: </span>
                                    <span>{formatDuration(session.startTime)}</span>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-secondary)' }}>Resolution: </span>
                                    <span>{session.resolution}</span>
                                </div>
                            </div>

                            <button
                                className="btn"
                                onClick={() => handleDisconnect(session.id)}
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid #ef4444'
                                }}
                            >
                                <Power size={14} style={{ marginRight: '0.5rem' }} />
                                Disconnect
                            </button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RDPSessions;

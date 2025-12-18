import React, { useState, useEffect } from 'react';
import { X, Server, Terminal, Bookmark, Play, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';

/**
 * SplitPaneConnectionModal Component
 * Modal for choosing connection type when adding a new split pane
 * Options: Custom SSH (manual entry) or Saved Service (from services list)
 */
const SplitPaneConnectionModal = ({ isOpen, onClose, onConnect, services = [] }) => {
    const [mode, setMode] = useState('choose'); // 'choose', 'service', 'custom'
    const [selectedService, setSelectedService] = useState(null);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [customConnection, setCustomConnection] = useState({
        host: '',
        port: '22',
        username: '',
        password: ''
    });

    const resetState = () => {
        setMode('choose');
        setSelectedService(null);
        setCredentials({ username: '', password: '' });
        setCustomConnection({ host: '', port: '22', username: '', password: '' });
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleServiceConnect = () => {
        if (!selectedService || !credentials.username) return;
        onConnect({
            type: 'service',
            service: selectedService,
            credentials
        });
        handleClose();
    };

    const handleCustomConnect = () => {
        if (!customConnection.host || !customConnection.username) return;
        onConnect({
            type: 'custom',
            connectionDetails: customConnection
        });
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1001
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '12px',
                padding: '1.5rem',
                zIndex: 1002,
                maxWidth: '450px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h3 style={{
                        margin: 0,
                        color: '#c9d1d9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <Terminal size={24} />
                        {mode === 'choose' ? 'Add New Pane' :
                            mode === 'service' ? 'Connect to Service' :
                                'Custom SSH Connection'}
                    </h3>
                    <button
                        onClick={handleClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#8b949e'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Choose Mode */}
                {mode === 'choose' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ color: '#8b949e', fontSize: '14px', margin: 0 }}>
                            Choose how to connect this terminal pane:
                        </p>

                        <button
                            onClick={() => setMode('service')}
                            style={{
                                padding: '1.25rem',
                                background: 'linear-gradient(135deg, #1f6feb15, #1f6feb05)',
                                border: '1px solid #1f6feb50',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#c9d1d9',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Server size={32} color="#1f6feb" />
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '16px' }}>Saved Service</div>
                                <div style={{ fontSize: '13px', color: '#8b949e', marginTop: '4px' }}>
                                    Connect to a configured service
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('custom')}
                            style={{
                                padding: '1.25rem',
                                background: 'linear-gradient(135deg, #a855f715, #a855f705)',
                                border: '1px solid #a855f750',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#c9d1d9',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Terminal size={32} color="#a855f7" />
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '16px' }}>Custom SSH</div>
                                <div style={{ fontSize: '13px', color: '#8b949e', marginTop: '4px' }}>
                                    Enter host and credentials manually
                                </div>
                            </div>
                        </button>
                    </div>
                )}

                {/* Service Connection Mode */}
                {mode === 'service' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={() => setMode('choose')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#58a6ff',
                                cursor: 'pointer',
                                fontSize: '13px',
                                padding: 0,
                                marginBottom: '0.5rem',
                                textAlign: 'left'
                            }}
                        >
                            ← Back to options
                        </button>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '13px' }}>
                                Select Service
                            </label>
                            <select
                                value={selectedService?.id || ''}
                                onChange={(e) => {
                                    const svc = services.find(s => s.id === parseInt(e.target.value));
                                    setSelectedService(svc || null);
                                    // Auto-fill credentials if service has saved SSH credentials
                                    if (svc && svc.ssh_username) {
                                        setCredentials({
                                            username: svc.ssh_username || '',
                                            password: svc.ssh_password || ''
                                        });
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: '#21262d',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#c9d1d9',
                                    fontSize: '14px'
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '13px' }}>
                                Username
                            </label>
                            <input
                                type="text"
                                value={credentials.username}
                                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                placeholder="SSH Username"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: '#21262d',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#c9d1d9',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '13px' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                placeholder="SSH Password"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: '#21262d',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#c9d1d9',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <button
                            onClick={handleServiceConnect}
                            disabled={!selectedService || !credentials.username}
                            style={{
                                padding: '0.75rem',
                                background: selectedService && credentials.username ? '#238636' : '#21262d',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: selectedService && credentials.username ? 'pointer' : 'not-allowed',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginTop: '0.5rem'
                            }}
                        >
                            <Play size={16} />
                            Connect
                        </button>
                    </div>
                )}

                {/* Custom SSH Mode */}
                {mode === 'custom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={() => setMode('choose')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#58a6ff',
                                cursor: 'pointer',
                                fontSize: '13px',
                                padding: 0,
                                marginBottom: '0.5rem',
                                textAlign: 'left'
                            }}
                        >
                            ← Back to options
                        </button>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 2 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '13px' }}>
                                    Host / IP
                                </label>
                                <input
                                    type="text"
                                    value={customConnection.host}
                                    onChange={(e) => setCustomConnection({ ...customConnection, host: e.target.value })}
                                    placeholder="192.168.1.100"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: '#21262d',
                                        border: '1px solid #30363d',
                                        borderRadius: '6px',
                                        color: '#c9d1d9',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '13px' }}>
                                    Port
                                </label>
                                <input
                                    type="text"
                                    value={customConnection.port}
                                    onChange={(e) => setCustomConnection({ ...customConnection, port: e.target.value })}
                                    placeholder="22"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: '#21262d',
                                        border: '1px solid #30363d',
                                        borderRadius: '6px',
                                        color: '#c9d1d9',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '13px' }}>
                                Username
                            </label>
                            <input
                                type="text"
                                value={customConnection.username}
                                onChange={(e) => setCustomConnection({ ...customConnection, username: e.target.value })}
                                placeholder="root"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: '#21262d',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#c9d1d9',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '13px' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={customConnection.password}
                                onChange={(e) => setCustomConnection({ ...customConnection, password: e.target.value })}
                                placeholder="Password"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: '#21262d',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#c9d1d9',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <button
                            onClick={handleCustomConnect}
                            disabled={!customConnection.host || !customConnection.username}
                            style={{
                                padding: '0.75rem',
                                background: customConnection.host && customConnection.username ? '#a855f7' : '#21262d',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: customConnection.host && customConnection.username ? 'pointer' : 'not-allowed',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginTop: '0.5rem'
                            }}
                        >
                            <Terminal size={16} />
                            Connect
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default SplitPaneConnectionModal;

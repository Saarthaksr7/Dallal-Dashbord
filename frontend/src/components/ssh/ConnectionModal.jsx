import React, { useState } from 'react';
import { X, Server, Zap } from 'lucide-react';

/**
 * ConnectionModal Component
 * Two-step modal for choosing connection type and display mode
 */
const ConnectionModal = ({ isOpen, onClose, onConnect }) => {
    const [step, setStep] = useState(1);
    const [connectionType, setConnectionType] = useState(null); // 'service' or 'custom'
    const [displayMode, setDisplayMode] = useState(null); // 'split' or 'tab'

    const handleConnectionTypeSelect = (type) => {
        setConnectionType(type);
        setStep(2);
    };

    const handleDisplayModeSelect = (mode) => {
        setDisplayMode(mode);
        onConnect({ type: connectionType, mode });
        resetAndClose();
    };

    const resetAndClose = () => {
        setStep(1);
        setConnectionType(null);
        setDisplayMode(null);
        onClose();
    };

    const goBack = () => {
        setStep(1);
        setDisplayMode(null);
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                onClick={resetAndClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 999
                }}
            />

            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '8px',
                padding: '1.5rem',
                zIndex: 1000,
                maxWidth: '500px',
                width: '90%'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: '#c9d1d9' }}>
                        {step === 1 ? 'Choose Connection Type' : 'Choose Display Mode'}
                    </h3>
                    <button onClick={resetAndClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Step Indicator */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        flex: 1,
                        height: '4px',
                        background: step >= 1 ? '#1f6feb' : '#21262d',
                        borderRadius: '2px'
                    }} />
                    <div style={{
                        flex: 1,
                        height: '4px',
                        background: step >= 2 ? '#1f6feb' : '#21262d',
                        borderRadius: '2px'
                    }} />
                </div>

                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={() => handleConnectionTypeSelect('service')}
                            style={{
                                padding: '1.5rem',
                                background: '#161b22',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#c9d1d9',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1f6feb'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#30363d'}
                        >
                            <Server size={32} color="#3fb950" />
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Saved Services</div>
                                <div style={{ fontSize: '13px', color: '#8b949e' }}>Connect to a monitored service</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleConnectionTypeSelect('custom')}
                            style={{
                                padding: '1.5rem',
                                background: '#161b22',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#c9d1d9',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1f6feb'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#30363d'}
                        >
                            <Zap size={32} color="#f85149" />
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Custom SSH</div>
                                <div style={{ fontSize: '13px', color: '#8b949e' }}>Connect to any SSH server</div>
                            </div>
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={() => handleDisplayModeSelect('split')}
                            style={{
                                padding: '1.5rem',
                                background: '#161b22',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#c9d1d9',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1f6feb'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#30363d'}
                        >
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Split Screen</div>
                            <div style={{ fontSize: '13px', color: '#8b949e' }}>Add terminal pane to current view</div>
                        </button>

                        <button
                            onClick={() => handleDisplayModeSelect('tab')}
                            style={{
                                padding: '1.5rem',
                                background: '#161b22',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#c9d1d9',
                                textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1f6feb'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#30363d'}
                        >
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>New Tab</div>
                            <div style={{ fontSize: '13px', color: '#8b949e' }}>Open in new browser tab</div>
                        </button>

                        <button
                            onClick={goBack}
                            style={{
                                padding: '0.75rem',
                                background: '#21262d',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#8b949e',
                                fontSize: '13px'
                            }}
                        >
                            ← Back
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default ConnectionModal;

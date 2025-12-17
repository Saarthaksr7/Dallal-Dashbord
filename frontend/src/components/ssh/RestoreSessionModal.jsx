import React from 'react';
import { History, Play, X, Terminal } from 'lucide-react';

/**
 * RestoreSessionModal Component
 * Shows options when restoring a saved session
 */
const RestoreSessionModal = ({ isOpen, session, onShowHistory, onContinue, onClose }) => {
    if (!isOpen || !session) return null;

    const historyCount = session.history?.length || 0;

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
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
                borderRadius: '12px',
                padding: '2rem',
                zIndex: 1000,
                maxWidth: '450px',
                width: '90%'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h3 style={{ margin: 0, color: '#c9d1d9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Terminal size={24} color="#3b82f6" />
                        Restore Session
                    </h3>
                    <button
                        onClick={onClose}
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

                {/* Session Info */}
                <div style={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#8b949e', fontSize: '12px' }}>Session Name</span>
                        <div style={{ color: '#c9d1d9', fontWeight: '600', fontSize: '16px' }}>
                            {session.name}
                        </div>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#8b949e', fontSize: '12px' }}>Service</span>
                        <div style={{ color: '#c9d1d9' }}>
                            {session.service?.name || 'Unknown'}
                        </div>
                    </div>
                    <div>
                        <span style={{ color: '#8b949e', fontSize: '12px' }}>History</span>
                        <div style={{ color: '#c9d1d9' }}>
                            {historyCount} command{historyCount !== 1 ? 's' : ''} saved
                        </div>
                    </div>
                </div>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={onShowHistory}
                        style={{
                            padding: '1rem',
                            background: '#21262d',
                            border: '1px solid #30363d',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#c9d1d9',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            textAlign: 'left'
                        }}
                    >
                        <History size={24} color="#8b949e" />
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>View History Only</div>
                            <div style={{ fontSize: '12px', color: '#8b949e' }}>
                                Browse previous terminal output without connecting
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={onContinue}
                        style={{
                            padding: '1rem',
                            background: '#238636',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            textAlign: 'left'
                        }}
                    >
                        <Play size={24} />
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Continue Session</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                                Reconnect and continue where you left off
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </>
    );
};

export default RestoreSessionModal;

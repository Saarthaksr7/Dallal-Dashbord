import React, { useState } from 'react';
import { X, Save, Power, RefreshCw, FilePlus } from 'lucide-react';

/**
 * DisconnectModal Component
 * Modal for choosing to save session or just quit
 * If restoredSession is provided, shows Update/Save as New options
 */
const DisconnectModal = ({ isOpen, onClose, onSave, onUpdate, onQuit, restoredSession }) => {
    const [sessionName, setSessionName] = useState('');
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [saveMode, setSaveMode] = useState(null); // 'update', 'new', or null

    const handleSave = () => {
        if (showSaveForm) {
            if (!sessionName.trim()) {
                alert('Please enter a session name');
                return;
            }
            onSave(sessionName);
            resetAndClose();
        } else {
            setShowSaveForm(true);
        }
    };

    const handleUpdate = () => {
        if (restoredSession && onUpdate) {
            onUpdate(restoredSession.id, restoredSession.name);
            resetAndClose();
        }
    };

    const handleSaveAsNew = () => {
        setSaveMode('new');
        setShowSaveForm(true);
    };

    const handleQuit = () => {
        onQuit();
        resetAndClose();
    };

    const resetAndClose = () => {
        setSessionName('');
        setShowSaveForm(false);
        setSaveMode(null);
        onClose();
    };

    if (!isOpen) return null;

    const isRestoredSession = !!restoredSession;

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
                maxWidth: '400px',
                width: '90%'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: '#c9d1d9' }}>Disconnect SSH</h3>
                    <button onClick={resetAndClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e' }}>
                        <X size={20} />
                    </button>
                </div>

                {!showSaveForm ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ color: '#8b949e', fontSize: '14px', margin: '0 0 0.5rem 0' }}>
                            {isRestoredSession
                                ? `Would you like to update "${restoredSession.name}" or save as a new session?`
                                : 'Would you like to save this session before disconnecting?'
                            }
                        </p>

                        {isRestoredSession ? (
                            <>
                                {/* Update existing session button */}
                                <button
                                    onClick={handleUpdate}
                                    style={{
                                        padding: '1rem',
                                        background: '#238636',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    <RefreshCw size={16} />
                                    Update "{restoredSession.name}"
                                </button>

                                {/* Save as new button */}
                                <button
                                    onClick={handleSaveAsNew}
                                    style={{
                                        padding: '1rem',
                                        background: '#1f6feb',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        fontSize: '14px'
                                    }}
                                >
                                    <FilePlus size={16} />
                                    Save as New Session
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleSave}
                                style={{
                                    padding: '1rem',
                                    background: '#238636',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                <Save size={16} />
                                Save Session
                            </button>
                        )}

                        <button
                            onClick={handleQuit}
                            style={{
                                padding: '1rem',
                                background: '#21262d',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#c9d1d9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontSize: '14px'
                            }}
                        >
                            <Power size={16} />
                            Just Disconnect
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b949e', fontSize: '13px' }}>
                                {saveMode === 'new' ? 'New Session Name' : 'Session Name'}
                            </label>
                            <input
                                type="text"
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                placeholder="e.g., Production Server"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: '#0d1117',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#c9d1d9',
                                    fontSize: '14px'
                                }}
                                autoFocus
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleSave}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: '#238636',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    color: 'white',
                                    fontSize: '14px'
                                }}
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setShowSaveForm(false);
                                    setSaveMode(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: '#21262d',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    color: '#8b949e',
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default DisconnectModal;

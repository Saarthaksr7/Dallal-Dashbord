import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

const CustomCommandsMenu = ({ isOpen, onClose, onExecute }) => {
    const [customCommands, setCustomCommands] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCommand, setNewCommand] = useState({ name: '', code: '' });

    // Default commands
    const defaultCommands = [
        { name: 'Ctrl+C (Interrupt)', code: '\x03', default: true },
        { name: 'Ctrl+D (EOF)', code: '\x04', default: true },
        { name: 'Ctrl+Z (Suspend)', code: '\x1A', default: true },
        { name: 'Ctrl+L (Clear)', code: '\x0C', default: true },
        { name: 'Ctrl+X', code: '\x18', default: true },
        { name: 'Ctrl+Y', code: '\x19', default: true },
    ];

    // Load custom commands from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('ssh_custom_commands');
        if (saved) {
            setCustomCommands(JSON.parse(saved));
        }
    }, []);

    const saveCommands = (commands) => {
        localStorage.setItem('ssh_custom_commands', JSON.stringify(commands));
        setCustomCommands(commands);
    };

    const handleAddCommand = () => {
        if (!newCommand.name || !newCommand.code) return;

        const updated = [...customCommands, newCommand];
        saveCommands(updated);
        setNewCommand({ name: '', code: '' });
        setShowAddForm(false);
    };

    const handleDeleteCommand = (index) => {
        const updated = customCommands.filter((_, i) => i !== index);
        saveCommands(updated);
    };

    const pasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            onExecute(text);
            onClose();
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.3)',
                    zIndex: 999
                }}
            />

            {/* Menu */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1rem',
                zIndex: 1000,
                maxWidth: '400px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Custom Commands</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Default Commands */}
                <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Default Commands</h4>
                    {defaultCommands.map((cmd, index) => (
                        <button
                            key={index}
                            onClick={() => { onExecute(cmd.code); onClose(); }}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '4px',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                marginBottom: '0.5rem',
                                textAlign: 'left',
                                fontSize: '14px'
                            }}
                        >
                            {cmd.name}
                        </button>
                    ))}
                </div>

                {/* Paste from Clipboard */}
                <button
                    onClick={pasteFromClipboard}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '4px',
                        color: '#10b981',
                        cursor: 'pointer',
                        marginBottom: '1rem',
                        fontSize: '14px'
                    }}
                >
                    📋 Paste from Clipboard
                </button>

                {/* Custom Commands */}
                {customCommands.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Your Custom Commands</h4>
                        {customCommands.map((cmd, index) => (
                            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <button
                                    onClick={() => { onExecute(cmd.code); onClose(); }}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: 'rgba(139, 92, 246, 0.1)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '4px',
                                        color: '#8b5cf6',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontSize: '14px'
                                    }}
                                >
                                    {cmd.name}
                                </button>
                                <button
                                    onClick={() => handleDeleteCommand(index)}
                                    style={{
                                        padding: '0.75rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '4px',
                                        color: '#ef4444',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Custom Command Form */}
                {showAddForm ? (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Command Name (e.g., 'My Command')"
                            value={newCommand.name}
                            onChange={(e) => setNewCommand({ ...newCommand, name: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                color: 'var(--text-primary)',
                                marginBottom: '0.5rem'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Control Code (e.g., \\x03 for Ctrl+C)"
                            value={newCommand.code}
                            onChange={(e) => setNewCommand({ ...newCommand, code: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                color: 'var(--text-primary)',
                                marginBottom: '0.5rem'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleAddCommand}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: '#3b82f6',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Add
                            </button>
                            <button
                                onClick={() => { setShowAddForm(false); setNewCommand({ name: '', code: '' }); }}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '4px',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAddForm(true)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'var(--bg-secondary)',
                            border: '1px dashed var(--border)',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '14px'
                        }}
                    >
                        <Plus size={16} />
                        Add Custom Command
                    </button>
                )}
            </div>
        </>
    );
};

export default CustomCommandsMenu;

import React, { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const KeyboardShortcutsHelper = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyPress = (e) => {
            // Show shortcuts with '?'
            if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                // Don't trigger if typing in an input
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                e.preventDefault();
                setIsOpen(true);
            }

            // Close with ESC
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen]);

    if (!isOpen) return null;

    const shortcuts = [
        {
            category: 'Navigation',
            items: [
                { key: '/', description: 'Focus search' },
                { key: 'ESC', description: 'Close modals/dialogs' },
            ]
        },
        {
            category: 'Actions',
            items: [
                { key: 'N', description: 'Add new service' },
                { key: 'Ctrl + K', description: 'Open command palette' },
            ]
        },
        {
            category: 'Help',
            items: [
                { key: '?', description: 'Show keyboard shortcuts (this dialog)' },
            ]
        }
    ];

    return (
        <>
            {/* Overlay */}
            <div
                onClick={() => setIsOpen(false)}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9998,
                    animation: 'fadeIn 0.2s ease',
                }}
            />

            {/* Modal */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-lg)',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    zIndex: 9999,
                    animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Keyboard size={24} style={{ color: 'var(--accent)' }} />
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Keyboard Shortcuts</h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-secondary)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {shortcuts.map((section, idx) => (
                        <div key={idx} style={{ marginBottom: idx < shortcuts.length - 1 ? '2rem' : 0 }}>
                            <h3
                                style={{
                                    margin: '0 0 1rem 0',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {section.category}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {section.items.map((item, itemIdx) => (
                                    <div
                                        key={itemIdx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem 1rem',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.95rem' }}>{item.description}</span>
                                        <kbd
                                            style={{
                                                background: 'var(--bg-primary)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '6px',
                                                padding: '0.25rem 0.75rem',
                                                fontSize: '0.875rem',
                                                fontFamily: 'monospace',
                                                fontWeight: 600,
                                                color: 'var(--accent)',
                                                boxShadow: '0 2px 0 var(--border)',
                                            }}
                                        >
                                            {item.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid var(--border)',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        textAlign: 'center',
                    }}
                >
                    Press <kbd style={{ padding: '0.125rem 0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>ESC</kbd> to close
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -48%) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
            `}</style>
        </>
    );
};

export default KeyboardShortcutsHelper;

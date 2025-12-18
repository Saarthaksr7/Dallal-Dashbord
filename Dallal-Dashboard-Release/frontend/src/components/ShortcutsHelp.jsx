import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const ShortcutsHelp = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Keyboard size={24} /> Keyboard Shortcuts
                    </h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <div className="shortcuts-list">
                        <ShortcutItem keys={['?']} description="Show/Hide this help" />
                        <ShortcutItem keys={['/']} description="Focus Search" />
                        <ShortcutItem keys={['Esc']} description="Close Modal / Clear Selection" />

                        <div className="divider" style={{ margin: '1rem 0', borderBottom: '1px solid var(--border)' }} />

                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Services Page</h4>
                        <ShortcutItem keys={['n']} description="Add New Service" />
                    </div>
                </div>
            </div>

            <style>{`
                .shortcuts-list { display: flex; flexDirection: column; gap: 0.75rem; }
                .shortcut-item { display: flex; justify-content: space-between; alignItems: center; }
                .keys { display: flex; gap: 4px; }
                .key { 
                    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 4px; padding: 2px 6px; font-family: monospace; font-size: 0.9rem;
                    color: var(--text-primary); min-width: 24px; text-align: center;
                }
                .desc { color: var(--text-secondary); font-size: 0.95rem; }
            `}</style>
        </div>
    );
};

const ShortcutItem = ({ keys, description }) => (
    <div className="shortcut-item">
        <span className="desc">{description}</span>
        <div className="keys">
            {keys.map((k, i) => (
                <span key={i} className="key">{k}</span>
            ))}
        </div>
    </div>
);

export default ShortcutsHelp;

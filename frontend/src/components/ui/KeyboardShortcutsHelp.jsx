import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';

/**
 * Keyboard Shortcuts Help Dialog
 * Shows all available keyboard shortcuts
 */
const KeyboardShortcutsHelp = ({ open, onClose }) => {
    if (!open) return null;

    // Close on Escape
    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && open) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    const formatKey = (key) => {
        return key
            .split('+')
            .map(k => {
                const keyMap = {
                    'ctrl': '⌃',
                    'shift': '⇧',
                    'alt': '⌥',
                    'cmd': '⌘',
                    'esc': 'Esc',
                };
                return keyMap[k.toLowerCase()] || k.toUpperCase();
            })
            .join(' + ');
    };

    return (
        <div className="confirm-dialog-overlay" onClick={onClose}>
            <div
                className="keyboard-shortcuts-dialog"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="shortcuts-title"
            >
                {/* Header */}
                <div className="keyboard-shortcuts-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Keyboard size={24} />
                        <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        className="confirm-dialog-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Shortcuts List */}
                <div className="keyboard-shortcuts-content">
                    {Object.entries(KEYBOARD_SHORTCUTS).map(([shortcut, description]) => (
                        <div key={shortcut} className="keyboard-shortcut-item">
                            <span className="keyboard-shortcut-description">{description}</span>
                            <kbd className="keyboard-shortcut-key">{formatKey(shortcut)}</kbd>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="keyboard-shortcuts-footer">
                    <p>Press <kbd>Ctrl + /</kbd> to toggle this help</p>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcutsHelp;

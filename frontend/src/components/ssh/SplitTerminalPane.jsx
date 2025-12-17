import React from 'react';
import { X } from 'lucide-react';

/**
 * SplitTerminalPane Component
 * Represents a single terminal pane in a split view
 */
const SplitTerminalPane = ({
    terminal,
    onClose,
    onSendCommand,
    currentCommand,
    setCurrentCommand,
    outputEndRef
}) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            const commandValue = currentCommand?.terminalId === terminal.id ? currentCommand.value : '';
            if (commandValue.trim()) {
                onSendCommand(terminal.id, commandValue);
                setCurrentCommand({ terminalId: terminal.id, value: '' });
            }
        }
    };

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#0d1117',
            border: '1px solid #333',
            borderRadius: '4px',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '300px',
            maxHeight: '100%'
        }}>
            {/* Pane Header */}
            <div style={{
                padding: '0.5rem',
                background: '#161b22',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
            }}>
                <span style={{ fontSize: '12px', color: '#8b949e' }}>
                    {terminal.name || `Terminal ${terminal.id}`}
                </span>
                <button
                    onClick={() => onClose(terminal.id)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#8b949e',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                    title="Close pane"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Terminal Output */}
            <div
                style={{
                    flex: 1,
                    height: 0,
                    overflowY: 'scroll',
                    overflowX: 'hidden',
                    padding: '0.5rem',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: '#c9d1d9',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                }}
                className="terminal-scrollbar"
            >
                {terminal.output.map((item, index) => (
                    <div key={index} style={{
                        marginBottom: '2px',
                        color: item.type === 'command' ? '#4a9eff' : item.type === 'error' ? '#ff6b6b' : item.type === 'info' ? '#ffd93d' : '#c9d1d9'
                    }}>
                        {item.text}
                    </div>
                ))}
                <div ref={outputEndRef} />
            </div>

            {/* Command Input */}
            <div style={{
                borderTop: '1px solid #333',
                padding: '0.5rem',
                display: 'flex',
                gap: '0.5rem',
                background: '#0d1117',
                flexShrink: 0
            }}>
                <span style={{ color: '#4a9eff', fontFamily: 'monospace', fontSize: '13px' }}>$</span>
                <input
                    type="text"
                    value={terminal.id === currentCommand?.terminalId ? currentCommand.value : ''}
                    onChange={(e) => setCurrentCommand({ terminalId: terminal.id, value: e.target.value })}
                    onKeyDown={handleKeyDown}
                    placeholder="Type command..."
                    disabled={!terminal.connected}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: terminal.connected ? '#c9d1d9' : '#6e7681',
                        fontFamily: 'monospace',
                        fontSize: '13px'
                    }}
                />
            </div>

            {/* Connection Status Indicator */}
            {!terminal.connected && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.8)',
                    padding: '1rem',
                    borderRadius: '4px',
                    color: '#8b949e',
                    fontSize: '13px'
                }}>
                    Not Connected
                </div>
            )}

            {/* Scrollbar Styles */}
            <style>{`
                .terminal-scrollbar::-webkit-scrollbar {
                    width: 12px;
                }
                .terminal-scrollbar::-webkit-scrollbar-track {
                    background: #0d1117;
                    border-left: 1px solid #30363d;
                }
                .terminal-scrollbar::-webkit-scrollbar-thumb {
                    background: #30363d;
                    border-radius: 6px;
                }
                .terminal-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #484f58;
                }
            `}</style>
        </div>
    );
};

export default SplitTerminalPane;

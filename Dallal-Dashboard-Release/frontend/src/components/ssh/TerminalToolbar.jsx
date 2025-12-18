import React from 'react';
import { Plus, Power, ExternalLink, SplitSquareHorizontal, Command } from 'lucide-react';

const TerminalToolbar = ({
    connected,
    onNewConnection,
    onDisconnect,
    onOpenTab,
    onSplit,
    onCustomCommand
}) => {
    return (
        <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            display: 'flex',
            gap: '0.5rem'
        }}>
            <button
                onClick={onNewConnection}
                style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                }}
                title="New Connection"
            >
                <Plus size={14} />
                <span>New</span>
            </button>

            <button
                onClick={onDisconnect}
                style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                }}
                title="Disconnect"
            >
                <Power size={14} />
                <span>Exit</span>
            </button>

            <button
                onClick={onOpenTab}
                style={{
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                }}
                title="Open in New Tab"
            >
                <ExternalLink size={14} />
                <span>Tab</span>
            </button>


            <button
                onClick={onSplit}
                style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                }}
                title="Split Terminal"
            >
                <SplitSquareHorizontal size={14} />
                <span>Split</span>
            </button>

            <button
                onClick={onCustomCommand}
                style={{
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                }}
                title="Custom Commands"
            >
                <Command size={14} />
                <span>Cmd</span>
            </button>
        </div>
    );
};

export default TerminalToolbar;

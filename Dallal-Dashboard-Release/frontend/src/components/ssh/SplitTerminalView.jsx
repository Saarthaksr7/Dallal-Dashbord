import React, { useState } from 'react';
import SplitTerminalPane from './SplitTerminalPane';
import ResizableSplitPane from './ResizableSplitPane';
import { Grid2X2, MinusSquare, PlusSquare } from 'lucide-react';

/**
 * SplitTerminalView Component
 * Manages multiple terminal panes in a split layout
 * Supports 1-4 terminals in various grid configurations
 */
const SplitTerminalView = ({ terminals, onAddTerminal, onCloseTerminal, onSendCommand }) => {
    const [layoutMode, setLayoutMode] = useState('horizontal'); // 'horizontal', 'vertical', 'grid'
    const [currentCommand, setCurrentCommand] = useState({ terminalId: null, value: '' });

    const getLayoutStyle = () => {
        const terminalCount = terminals.length;

        if (terminalCount === 1) {
            return { display: 'flex', flexDirection: 'column', gap: '0' };
        }

        if (terminalCount === 2) {
            return {
                display: 'flex',
                flexDirection: layoutMode === 'horizontal' ? 'row' : 'column',
                gap: '0' // No gap when using ResizableSplitPane
            };
        }

        // 3-4 terminals: use grid
        return {
            display: 'grid',
            gridTemplateColumns: terminalCount === 3 ? '1fr 1fr' : '1fr 1fr',
            gridTemplateRows: terminalCount === 3 ? 'auto auto' : '1fr 1fr',
            gap: '8px'
        };
    };

    const toggleLayout = () => {
        if (terminals.length === 2) {
            setLayoutMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
        }
    };

    const canAddMore = terminals.length < 4;

    const renderTerminalPanes = () => {
        const terminalCount = terminals.length;

        // For 2 terminals, use ResizableSplitPane
        if (terminalCount === 2) {
            return (
                <ResizableSplitPane
                    direction={layoutMode}
                    initialSize={50}
                >
                    <SplitTerminalPane
                        key={terminals[0].id}
                        terminal={terminals[0]}
                        onClose={onCloseTerminal}
                        onSendCommand={onSendCommand}
                        currentCommand={currentCommand}
                        setCurrentCommand={setCurrentCommand}
                    />
                    <SplitTerminalPane
                        key={terminals[1].id}
                        terminal={terminals[1]}
                        onClose={onCloseTerminal}
                        onSendCommand={onSendCommand}
                        currentCommand={currentCommand}
                        setCurrentCommand={setCurrentCommand}
                    />
                </ResizableSplitPane>
            );
        }

        // For 1, 3, or 4 terminals, render normally
        return terminals.map((terminal) => (
            <SplitTerminalPane
                key={terminal.id}
                terminal={terminal}
                onClose={onCloseTerminal}
                onSendCommand={onSendCommand}
                currentCommand={currentCommand}
                setCurrentCommand={setCurrentCommand}
            />
        ));
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Split View Controls */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.5rem',
                background: '#161b22',
                borderRadius: '4px',
                border: '1px solid #333'
            }}>
                <button
                    onClick={toggleLayout}
                    disabled={terminals.length !== 2}
                    style={{
                        padding: '0.5rem 1rem',
                        background: terminals.length === 2 ? '#238636' : '#21262d',
                        color: terminals.length === 2 ? 'white' : '#6e7681',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: terminals.length === 2 ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    title="Toggle horizontal/vertical split"
                >
                    <MinusSquare size={14} />
                    {layoutMode === 'horizontal' ? 'Horizontal' : 'Vertical'}
                </button>

                <button
                    onClick={onAddTerminal}
                    disabled={!canAddMore}
                    style={{
                        padding: '0.5rem 1rem',
                        background: canAddMore ? '#1f6feb' : '#21262d',
                        color: canAddMore ? 'white' : '#6e7681',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: canAddMore ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    title="Add terminal pane"
                >
                    <PlusSquare size={14} />
                    Add Pane ({terminals.length}/4)
                </button>

                {terminals.length > 2 && (
                    <div style={{
                        padding: '0.5rem 1rem',
                        background: '#21262d',
                        color: '#8b949e',
                        borderRadius: '4px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <Grid2X2 size={14} />
                        Grid Layout
                    </div>
                )}
            </div>

            {/* Terminal Panes */}
            <div style={{ ...getLayoutStyle(), flex: 1, minHeight: 0 }}>
                {renderTerminalPanes()}
            </div>
        </div>
    );
};

export default SplitTerminalView;

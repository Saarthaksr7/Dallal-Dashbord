import React, { useState, useRef } from 'react';

/**
 * ResizableSplitPane Component
 * Wraps two children with a draggable divider for resizing
 */
const ResizableSplitPane = ({ children, direction = 'horizontal', initialSize = 50 }) => {
    const [size, setSize] = useState(initialSize); // Percentage for first pane
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !containerRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();

        let newSize;
        if (direction === 'horizontal') {
            const offsetX = e.clientX - rect.left;
            newSize = (offsetX / rect.width) * 100;
        } else {
            const offsetY = e.clientY - rect.top;
            newSize = (offsetY / rect.height) * 100;
        }

        // Constrain between 20% and 80%
        newSize = Math.max(20, Math.min(80, newSize));
        setSize(newSize);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

    const isHorizontal = direction === 'horizontal';

    return (
        <div
            ref={containerRef}
            style={{
                display: 'flex',
                flexDirection: isHorizontal ? 'row' : 'column',
                width: '100%',
                height: '100%',
                position: 'relative',
                userSelect: isDragging ? 'none' : 'auto'
            }}
        >
            {/* First Pane */}
            <div style={{
                [isHorizontal ? 'width' : 'height']: `${size}%`,
                overflow: 'hidden',
                minWidth: isHorizontal ? '200px' : undefined,
                minHeight: !isHorizontal ? '200px' : undefined,
                display: 'flex',
                flexDirection: 'column',
                height: isHorizontal ? '100%' : undefined,
                width: !isHorizontal ? '100%' : undefined
            }}>
                {children[0]}
            </div>

            {/* Divider */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    [isHorizontal ? 'width' : 'height']: '4px',
                    background: isDragging ? '#3b82f6' : '#30363d',
                    cursor: isHorizontal ? 'col-resize' : 'row-resize',
                    transition: isDragging ? 'none' : 'background 0.2s',
                    position: 'relative',
                    flexShrink: 0,
                    zIndex: 10
                }}
                onMouseEnter={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.background = '#3b82f6';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.background = '#30363d';
                    }
                }}
            >
                {/* Visual indicator */}
                <div style={{
                    position: 'absolute',
                    [isHorizontal ? 'top' : 'left']: '50%',
                    [isHorizontal ? 'left' : 'top']: '50%',
                    transform: 'translate(-50%, -50%)',
                    [isHorizontal ? 'width' : 'height']: '2px',
                    [isHorizontal ? 'height' : 'width']: '30px',
                    background: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '2px',
                    pointerEvents: 'none'
                }} />
            </div>

            {/* Second Pane */}
            <div style={{
                flex: 1,
                overflow: 'hidden',
                minWidth: isHorizontal ? '200px' : undefined,
                minHeight: !isHorizontal ? '200px' : undefined,
                display: 'flex',
                flexDirection: 'column',
                height: isHorizontal ? '100%' : undefined,
                width: !isHorizontal ? '100%' : undefined
            }}>
                {children[1]}
            </div>
        </div>
    );
};

export default ResizableSplitPane;

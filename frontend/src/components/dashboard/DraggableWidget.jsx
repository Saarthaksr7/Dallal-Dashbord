import React, { useState } from 'react';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';

const DraggableWidget = ({
    id,
    children,
    editMode,
    onRemove,
    onSizeChange,
    size = 'medium'
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleDragStart = (e) => {
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        if (editMode) {
            e.preventDefault();
            setDragOver(true);
        }
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);

        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== id) {
            // Trigger reorder via parent
            const event = new CustomEvent('widget-reorder', {
                detail: { draggedId, targetId: id }
            });
            window.dispatchEvent(event);
        }
    };

    const cycleSizeForward = () => {
        const sizes = ['small', 'medium', 'large', 'full'];
        const currentIndex = sizes.indexOf(size);
        const nextSize = sizes[(currentIndex + 1) % sizes.length];
        onSizeChange?.(id, nextSize);
    };

    const sizeClasses = {
        small: 'widget-small',
        medium: 'widget-medium',
        large: 'widget-large',
        full: 'widget-full'
    };

    const sizeIcons = {
        small: <Minimize2 size={14} />,
        medium: <Maximize2 size={14} />,
        large: <Maximize2 size={16} />,
        full: <Maximize2 size={16} />
    };

    return (
        <div
            draggable={editMode}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`draggable-widget ${sizeClasses[size]} ${isDragging ? 'dragging' : ''} ${dragOver ? 'drag-over' : ''}`}
            data-widget-id={id}
            style={{
                position: 'relative',
                opacity: isDragging ? 0.5 : 1,
                cursor: editMode ? 'move' : 'default',
                transition: 'all 0.2s ease'
            }}
        >
            {editMode && (
                <div className="widget-controls">
                    <button
                        className="drag-handle"
                        aria-label="Drag to reorder"
                        style={{ cursor: 'move' }}
                    >
                        <GripVertical size={18} />
                    </button>
                    <button
                        className="widget-size"
                        onClick={cycleSizeForward}
                        aria-label={`Change widget size (current: ${size})`}
                        title={`Current: ${size}. Click to change`}
                    >
                        {sizeIcons[size]}
                    </button>
                    <button
                        className="widget-remove"
                        onClick={() => onRemove?.(id)}
                        aria-label="Hide widget"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
            <div className="widget-content">
                {children}
            </div>
        </div>
    );
};

export default DraggableWidget;

import React, { useState } from 'react';
import { X, Plus, Tag as TagIcon, Edit2, Trash2 } from 'lucide-react';

/**
 * TagManager Component
 * Manages service tags with color coding
 * Allows tag creation, editing, deletion, and assignment
 */
const TagManager = ({ isOpen, onClose, tags = [], onSave }) => {
    const [localTags, setLocalTags] = useState(tags);
    const [isCreating, setIsCreating] = useState(false);
    const [editingTag, setEditingTag] = useState(null);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3b82f6');

    // Predefined color palette
    const colorPalette = [
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Purple', value: '#a855f7' },
        { name: 'Pink', value: '#ec4899' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Yellow', value: '#eab308' },
        { name: 'Green', value: '#22c55e' },
        { name: 'Teal', value: '#14b8a6' },
        { name: 'Cyan', value: '#06b6d4' },
        { name: 'Indigo', value: '#6366f1' },
    ];

    const handleCreateTag = () => {
        if (!newTagName.trim()) return;

        const newTag = {
            id: Date.now().toString(),
            name: newTagName.trim(),
            color: newTagColor,
            createdAt: new Date().toISOString(),
        };

        setLocalTags([...localTags, newTag]);
        setNewTagName('');
        setNewTagColor('#3b82f6');
        setIsCreating(false);
    };

    const handleEditTag = (tag) => {
        setEditingTag(tag);
        setNewTagName(tag.name);
        setNewTagColor(tag.color);
    };

    const handleUpdateTag = () => {
        if (!newTagName.trim() || !editingTag) return;

        setLocalTags(localTags.map(tag =>
            tag.id === editingTag.id
                ? { ...tag, name: newTagName.trim(), color: newTagColor }
                : tag
        ));

        setEditingTag(null);
        setNewTagName('');
        setNewTagColor('#3b82f6');
    };

    const handleDeleteTag = (tagId) => {
        if (window.confirm('Delete this tag? It will be removed from all services.')) {
            setLocalTags(localTags.filter(tag => tag.id !== tagId));
        }
    };

    const handleSave = () => {
        onSave(localTags);
        onClose();
    };

    const handleCancel = () => {
        setLocalTags(tags);
        setIsCreating(false);
        setEditingTag(null);
        setNewTagName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleCancel}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                role="dialog"
                aria-labelledby="tag-manager-title"
            >
                {/* Header */}
                <div className="modal-header">
                    <h2 id="tag-manager-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TagIcon size={24} />
                        Manage Tags
                    </h2>
                    <button
                        className="close-btn"
                        onClick={handleCancel}
                        aria-label="Close tag manager"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body" style={{ flex: 1, overflow: 'auto' }}>
                    {/* Create/Edit Form */}
                    {(isCreating || editingTag) && (
                        <div style={{
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                        }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>
                                {editingTag ? 'Edit Tag' : 'Create New Tag'}
                            </h3>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    Tag Name
                                </label>
                                <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    placeholder="Enter tag name"
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.9375rem',
                                    }}
                                    aria-label="Tag name"
                                    autoFocus
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    Tag Color {newTagColor && <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>({newTagColor})</span>}
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {colorPalette.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setNewTagColor(color.value)}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '6px',
                                                background: color.value,
                                                border: newTagColor === color.value ? '3px solid var(--accent)' : '2px solid var(--glass-border)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                            title={color.name}
                                            aria-label={`Select ${color.name} color`}
                                        />
                                    ))}
                                    {/* Custom color picker */}
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="color"
                                            value={newTagColor}
                                            onChange={(e) => setNewTagColor(e.target.value)}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '6px',
                                                border: '2px solid var(--glass-border)',
                                                cursor: 'pointer',
                                            }}
                                            aria-label="Custom color picker"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={editingTag ? handleUpdateTag : handleCreateTag}
                                    disabled={!newTagName.trim()}
                                    style={{
                                        flex: 1,
                                        padding: '0.625rem',
                                        background: 'var(--accent)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        cursor: newTagName.trim() ? 'pointer' : 'not-allowed',
                                        opacity: newTagName.trim() ? 1 : 0.5,
                                    }}
                                >
                                    {editingTag ? 'Update Tag' : 'Create Tag'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsCreating(false);
                                        setEditingTag(null);
                                        setNewTagName('');
                                        setNewTagColor('#3b82f6');
                                    }}
                                    style={{
                                        padding: '0.625rem 1rem',
                                        background: 'var(--glass-bg)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Add Tag Button */}
                    {!isCreating && !editingTag && (
                        <button
                            onClick={() => setIsCreating(true)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'var(--glass-bg)',
                                border: '2px dashed var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginBottom: '1.5rem',
                                fontWeight: 500,
                            }}
                            aria-label="Add new tag"
                        >
                            <Plus size={20} />
                            Add New Tag
                        </button>
                    )}

                    {/* Tags List */}
                    <div>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                            Existing Tags ({localTags.length})
                        </h3>

                        {localTags.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '2rem',
                                color: 'var(--text-secondary)',
                            }}>
                                No tags yet. Create your first tag to organize services.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {localTags.map((tag) => (
                                    <div
                                        key={tag.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            background: 'var(--glass-bg)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '6px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '4px',
                                                    background: tag.color,
                                                }}
                                                aria-hidden="true"
                                            />
                                            <span style={{ fontWeight: 500 }}>{tag.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button
                                                onClick={() => handleEditTag(tag)}
                                                style={{
                                                    padding: '0.5rem',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    borderRadius: '4px',
                                                }}
                                                aria-label={`Edit ${tag.name} tag`}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTag(tag.id)}
                                                style={{
                                                    padding: '0.5rem',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--status-error)',
                                                    cursor: 'pointer',
                                                    borderRadius: '4px',
                                                }}
                                                aria-label={`Delete ${tag.name} tag`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: '0.625rem 1.25rem',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '0.625rem 1.25rem',
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TagManager;

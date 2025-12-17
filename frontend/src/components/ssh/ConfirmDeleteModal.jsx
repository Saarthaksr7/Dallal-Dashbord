import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

/**
 * ConfirmDeleteModal Component
 * Custom modal for confirming session deletion
 */
const ConfirmDeleteModal = ({ isOpen, sessionName, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <>
            <div
                onClick={onCancel}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    zIndex: 999
                }}
            />

            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '12px',
                padding: '1.5rem',
                zIndex: 1000,
                maxWidth: '400px',
                width: '90%'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{
                        margin: 0,
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <AlertTriangle size={24} />
                        Delete Session
                    </h3>
                    <button
                        onClick={onCancel}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#8b949e'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <p style={{ color: '#c9d1d9', marginBottom: '1.5rem', fontSize: '14px' }}>
                    Are you sure you want to delete <strong>"{sessionName}"</strong>?
                    This action cannot be undone.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: '#21262d',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#c9d1d9',
                            fontSize: '14px'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: '#da3633',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                </div>
            </div>
        </>
    );
};

export default ConfirmDeleteModal;

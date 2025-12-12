import React from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';

/**
 * Confirmation Dialog Component
 * Used for confirming destructive or important actions
 * 
 * @param {boolean} open - Whether dialog is open
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message/description
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Callback when cancelled
 * @param {string} variant - Visual variant: 'danger', 'warning', 'info', 'success'
 */
const ConfirmDialog = ({
    open,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'danger'
}) => {
    if (!open) return null;

    const icons = {
        danger: <AlertTriangle size={48} color="var(--danger, #ef4444)" />,
        warning: <AlertTriangle size={48} color="var(--warning, #f59e0b)" />,
        info: <Info size={48} color="var(--info, #3b82f6)" />,
        success: <CheckCircle size={48} color="var(--success, #10b981)" />
    };

    const confirmColors = {
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        success: '#10b981'
    };

    // Prevent background scroll when dialog is open
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    // Close on Escape key
    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && open) {
                onCancel();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onCancel]);

    return (
        <div className="confirm-dialog-overlay" onClick={onCancel}>
            <div
                className="confirm-dialog"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
                aria-describedby="dialog-description"
            >
                {/* Close button */}
                <button
                    className="confirm-dialog-close"
                    onClick={onCancel}
                    aria-label="Close dialog"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="confirm-dialog-icon">
                    {icons[variant]}
                </div>

                {/* Content */}
                <div className="confirm-dialog-content">
                    <h2 id="dialog-title" className="confirm-dialog-title">
                        {title}
                    </h2>
                    <p id="dialog-description" className="confirm-dialog-message">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="confirm-dialog-actions">
                    <button
                        className="confirm-dialog-button confirm-dialog-button-cancel"
                        onClick={onCancel}
                        autoFocus
                    >
                        {cancelText}
                    </button>
                    <button
                        className="confirm-dialog-button confirm-dialog-button-confirm"
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                        style={{ background: confirmColors[variant] }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

/**
 * Toast Notification Component
 * Shows temporary notifications for connection status
 */
const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <XCircle size={20} />;
            default:
                return <Info size={20} />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success':
                return {
                    bg: '#10b981',
                    border: '#059669',
                    text: '#ffffff'
                };
            case 'error':
                return {
                    bg: '#ef4444',
                    border: '#dc2626',
                    text: '#ffffff'
                };
            default:
                return {
                    bg: '#3b82f6',
                    border: '#2563eb',
                    text: '#ffffff'
                };
        }
    };

    const colors = getColors();

    return (
        <div style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            background: colors.bg,
            color: colors.text,
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            border: `2px solid ${colors.border}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            minWidth: '300px',
            maxWidth: '500px',
            zIndex: 9999,
            animation: 'slideIn 0.3s ease-out'
        }}>
            {getIcon()}
            <span style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>
                {message}
            </span>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: colors.text,
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                }}
                title="Close"
            >
                <X size={16} />
            </button>
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default Toast;

import React from 'react';
import { useUIStore } from '../../store/ui';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ id, message, type, onClose }) => {
    const styles = {
        success: { color: 'var(--success)', border: '2px solid var(--success)' },
        error: { color: 'var(--danger)', border: '2px solid var(--danger)' },
        warning: { color: 'var(--warning)', border: '2px solid var(--warning)' },
        info: { color: 'var(--info)', border: '2px solid var(--info)' }
    };

    const icons = {
        success: <CheckCircle size={20} style={{ color: 'var(--success)' }} aria-hidden="true" />,
        error: <AlertCircle size={20} style={{ color: 'var(--danger)' }} aria-hidden="true" />,
        warning: <AlertTriangle size={20} style={{ color: 'var(--warning)' }} aria-hidden="true" />,
        info: <Info size={20} style={{ color: 'var(--info)' }} aria-hidden="true" />
    };

    const role = type === 'error' ? 'alert' : 'status';
    const ariaLive = type === 'error' ? 'assertive' : 'polite';
    const style = styles[type] || styles.info;

    return (
        <div
            role={role}
            aria-live={ariaLive}
            style={{
                background: 'var(--bg-card)',
                ...style,
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-lg)',
                minWidth: '320px',
                maxWidth: '450px',
                animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
        >
            <div style={{ flexShrink: 0 }}>{icons[type] || icons.info}</div>
            <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: 500 }}>{message}</div>
            <button
                onClick={() => onClose(id)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                aria-label="Close notification"
            >
                <X size={16} />
            </button>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(120%) scale(0.9); opacity: 0; }
                    to { transform: translateX(0) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const ToastContainer = () => {
    const { toasts, removeToast } = useUIStore();

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            zIndex: 9999
        }}>
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={removeToast} />
            ))}
        </div>
    );
};

export default ToastContainer;

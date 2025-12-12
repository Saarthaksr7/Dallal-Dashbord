import React from 'react';
import { useUIStore } from '../../store/ui';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ id, message, type, onClose }) => {
    const icons = {
        success: <CheckCircle size={20} color="#22c55e" aria-hidden="true" />,
        error: <AlertCircle size={20} color="#ef4444" aria-hidden="true" />,
        warning: <AlertTriangle size={20} color="#f59e0b" aria-hidden="true" />,
        info: <Info size={20} color="#3b82f6" aria-hidden="true" />
    };

    const role = type === 'error' ? 'alert' : 'status';
    const ariaLive = type === 'error' ? 'assertive' : 'polite';

    return (
        <div
            role={role}
            aria-live={ariaLive}
            style={{
                background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                padding: '1rem', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                minWidth: '300px', maxWidth: '400px',
                animation: 'slideIn 0.3s ease-out'
            }}
        >
            <div>{icons[type] || icons.info}</div>
            <div style={{ flex: 1, fontSize: '0.95rem' }}>{message}</div>
            <button
                onClick={() => onClose(id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                aria-label="Close notification"
            >
                <X size={16} />
            </button>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
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

import React from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

const ServerErrorPage = ({ error = null }) => {
    const handleReload = () => {
        window.location.reload();
    };

    const handleGoHome = () => {
        window.location.href = '/';
    };

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <AlertTriangle size={80} color="#ef4444" style={{ marginBottom: '1.5rem' }} />

                <h1 style={styles.code}>500</h1>
                <h2 style={styles.title}>Internal Server Error</h2>
                <p style={styles.message}>
                    Something went wrong on our end. We're working to fix it.
                </p>

                {error && import.meta.env.DEV && (
                    <details style={styles.details}>
                        <summary style={styles.summary}>Error Details (Development)</summary>
                        <pre style={styles.errorText}>{error.toString()}</pre>
                    </details>
                )}

                <div style={styles.actions}>
                    <button onClick={handleReload} style={styles.button}>
                        <RefreshCw size={20} />
                        Try Again
                    </button>
                    <button onClick={handleGoHome} style={{ ...styles.button, ...styles.secondaryButton }}>
                        <Home size={20} />
                        Go to Dashboard
                    </button>
                </div>

                <p style={styles.helpText}>
                    If the problem persists, please contact support or check the system status.
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        padding: '2rem'
    },
    content: {
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '1rem',
        padding: '3rem',
        maxWidth: '600px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    },
    code: {
        fontSize: '6rem',
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: '0',
        lineHeight: '1'
    },
    title: {
        fontSize: '2rem',
        color: '#1f2937',
        marginBottom: '1rem'
    },
    message: {
        fontSize: '1.1rem',
        color: '#6b7280',
        marginBottom: '2rem'
    },
    details: {
        textAlign: 'left',
        marginBottom: '2rem',
        background: '#fef2f2',
        borderRadius: '0.5rem',
        border: '1px solid #fecaca'
    },
    summary: {
        padding: '1rem',
        cursor: 'pointer',
        fontWeight: '600',
        color: '#dc2626'
    },
    errorText: {
        padding: '1rem',
        margin: 0,
        fontSize: '0.875rem',
        color: '#991b1b',
        overflowX: 'auto'
    },
    actions: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        marginBottom: '2rem'
    },
    button: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'transform 0.2s'
    },
    secondaryButton: {
        background: '#6b7280'
    },
    helpText: {
        fontSize: '0.875rem',
        color: '#9ca3af'
    }
};

export default ServerErrorPage;

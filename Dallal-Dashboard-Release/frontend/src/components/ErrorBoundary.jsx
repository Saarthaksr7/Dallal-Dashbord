import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('Error Boundary caught an error:', error, errorInfo);
        }

        // Log to error tracking service (e.g., Sentry)
        if (import.meta.env.VITE_SENTRY_DSN) {
            // Sentry.captureException(error, { extra: errorInfo });
        }

        this.setState(prevState => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1
        }));

        // Auto-reload if too many consecutive errors (possible infinite loop)
        if (this.state.errorCount >= 5) {
            console.error('Too many errors detected, reloading page...');
            window.location.reload();
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={styles.container}>
                    <div style={styles.card}>
                        <div style={styles.iconContainer}>
                            <AlertTriangle size={64} color="#ef4444" />
                        </div>

                        <h1 style={styles.title}>Oops! Something went wrong</h1>
                        <p style={styles.subtitle}>
                            We're sorry for the inconvenience. The application encountered an unexpected error.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details style={styles.details}>
                                <summary style={styles.summary}>Error Details (Development Mode)</summary>
                                <div style={styles.errorBox}>
                                    <p style={styles.errorMessage}>
                                        <strong>Error:</strong> {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <pre style={styles.stackTrace}>
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            </details>
                        )}

                        <div style={styles.actions}>
                            <button onClick={this.handleReset} style={styles.button}>
                                <RefreshCw size={18} />
                                Try Again
                            </button>
                            <button onClick={this.handleReload} style={{ ...styles.button, ...styles.secondaryButton }}>
                                <RefreshCw size={18} />
                                Reload Page
                            </button>
                            <button onClick={this.handleGoHome} style={{ ...styles.button, ...styles.secondaryButton }}>
                                <Home size={18} />
                                Go to Dashboard
                            </button>
                        </div>

                        <p style={styles.helpText}>
                            If the problem persists, please contact support or check the{' '}
                            <a href="/settings" style={styles.link}>system logs</a>.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem'
    },
    card: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '1rem',
        padding: '3rem',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
    },
    iconContainer: {
        marginBottom: '1.5rem'
    },
    title: {
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '1rem'
    },
    subtitle: {
        fontSize: '1.1rem',
        color: '#6b7280',
        marginBottom: '2rem',
        lineHeight: '1.6'
    },
    details: {
        textAlign: 'left',
        marginBottom: '2rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb'
    },
    summary: {
        padding: '1rem',
        cursor: 'pointer',
        fontWeight: '600',
        color: '#374151',
        userSelect: 'none'
    },
    errorBox: {
        padding: '1rem',
        background: '#fef2f2'
    },
    errorMessage: {
        color: '#dc2626',
        marginBottom: '1rem'
    },
    stackTrace: {
        background: '#1f2937',
        color: '#f3f4f6',
        padding: '1rem',
        borderRadius: '0.375rem',
        fontSize: '0.875rem',
        overflow: 'auto',
        maxHeight: '200px'
    },
    actions: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '2rem'
    },
    button: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    secondaryButton: {
        background: '#6b7280',
    },
    helpText: {
        fontSize: '0.875rem',
        color: '#9ca3af'
    },
    link: {
        color: '#667eea',
        textDecoration: 'none',
        fontWeight: '600'
    }
};

export default ErrorBoundary;

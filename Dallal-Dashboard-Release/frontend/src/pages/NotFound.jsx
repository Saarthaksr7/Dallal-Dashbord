import React from 'react';
import { Link } from 'wouter';
import { Home, Search, RefreshCw } from 'lucide-react';

const NotFoundPage = () => {
    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <h1 style={styles.code}>404</h1>
                <h2 style={styles.title}>Page Not Found</h2>
                <p style={styles.message}>
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <div style={styles.actions}>
                    <Link href="/">
                        <button style={styles.button}>
                            <Home size={20} />
                            Go Home
                        </button>
                    </Link>
                    <button onClick={() => window.location.reload()} style={{ ...styles.button, ...styles.secondaryButton }}>
                        <RefreshCw size={20} />
                        Refresh Page
                    </button>
                </div>

                <div style={styles.suggestions}>
                    <p style={styles.suggestionsTitle}>You might want to:</p>
                    <ul style={styles.suggestionsList}>
                        <li><Link href="/dashboard">View Dashboard</Link></li>
                        <li><Link href="/services">Browse Services</Link></li>
                        <li><Link href="/monitoring">Check Monitoring</Link></li>
                    </ul>
                </div>
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        fontSize: '8rem',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        textDecoration: 'none'
    },
    secondaryButton: {
        background: '#6b7280'
    },
    suggestions: {
        marginTop: '2rem',
        paddingTop: '2rem',
        borderTop: '1px solid #e5e7eb'
    },
    suggestionsTitle: {
        color: '#6b7280',
        fontSize: '0.875rem',
        marginBottom: '0.5rem'
    },
    suggestionsList: {
        listStyle: 'none',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    }
};

export default NotFoundPage;

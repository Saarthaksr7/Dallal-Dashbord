import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '../store/auth';
import { Lock, User, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useTranslation();

    // Zustand
    const login = useAuthStore((state) => state.login);
    const error = useAuthStore((state) => state.error);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // Wouter
    const [location, setLocation] = useLocation();

    // Redirect if already logged in (moved to useEffect to avoid state update during render)
    useEffect(() => {
        if (isAuthenticated) {
            setLocation('/');
        }
    }, [isAuthenticated, setLocation]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return;

        setIsSubmitting(true);
        try {
            await login(username, password);
            // Login successful - zustand updates state, we redirect
            setLocation('/');
        } catch (err) {
            console.error("Login Error", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
        }}>
            <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '1rem', width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Dallal Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{t('login.subtitle')}</p>
                </div>

                {error && (
                    <div
                        role="alert"
                        aria-live="polite"
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--danger)',
                            padding: '0.75rem',
                            borderRadius: '0.375rem',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}
                    >
                        {t('login.error_generic')}
                    </div>
                )}

                <form onSubmit={handleSubmit} aria-label="Login form">
                    <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                        <label htmlFor="username" className="visually-hidden">{t('login.username')}</label>
                        <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)', pointerEvents: 'none' }} aria-hidden="true" />
                        <input
                            id="username"
                            name="username"
                            type="text"
                            className="input-field"
                            style={{ paddingLeft: '40px' }}
                            placeholder={t('login.username')}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            aria-invalid={error ? 'true' : 'false'}
                            aria-required="true"
                            required
                            autoFocus
                            autoComplete="username"
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <label htmlFor="password" className="visually-hidden">{t('login.password')}</label>
                        <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)', pointerEvents: 'none' }} aria-hidden="true" />
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="input-field"
                            style={{ paddingLeft: '40px' }}
                            placeholder={t('login.password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            aria-invalid={error ? 'true' : 'false'}
                            aria-required="true"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                    >
                        {isSubmitting && <span className="visually-hidden">Signing in, please wait</span>}
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> : t('login.signin')}
                    </button>
                </form>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}} />
            </div>
        </div>
    );
};

export default Login;

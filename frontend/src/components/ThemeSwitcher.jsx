import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/theme';

const ThemeSwitcher = ({ className = '' }) => {
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`theme-switcher ${className}`}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                position: 'relative',
                width: '40px',
                height: '40px',
            }}
        >
            <div
                style={{
                    position: 'relative',
                    width: '20px',
                    height: '20px',
                }}
            >
                <Sun
                    size={20}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        color: '#f59e0b',
                        opacity: isDark ? 0 : 1,
                        transform: isDark ? 'rotate(-90deg) scale(0.8)' : 'rotate(0deg) scale(1)',
                        transition: 'all 0.3s ease',
                    }}
                />
                <Moon
                    size={20}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        color: '#60a5fa',
                        opacity: isDark ? 1 : 0,
                        transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.8)',
                        transition: 'all 0.3s ease',
                    }}
                />
            </div>

            <style>{`
                .theme-switcher:hover {
                    transform: scale(1.05);
                    border-color: var(--accent);
                }

                .theme-switcher:active {
                    transform: scale(0.95);
                }
            `}</style>
        </button>
    );
};

export default ThemeSwitcher;

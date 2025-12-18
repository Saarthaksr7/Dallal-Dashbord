import React from 'react';

const LoadingSpinner = () => {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                minHeight: '200px',
                color: 'var(--text-secondary)'
            }}
        >
            <span className="visually-hidden">Loading content...</span>
            <div className="spinner" aria-hidden="true"></div>
            <style>{`
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--bg-secondary);
                    border-radius: 50%;
                    border-top-color: var(--accent);
                    animation: spin 1s ease-in-out infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;

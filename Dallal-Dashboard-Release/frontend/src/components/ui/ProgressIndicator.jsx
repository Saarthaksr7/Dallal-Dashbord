import React from 'react';

/**
 * ProgressIndicator Component
 * Shows deterministic or indeterminate loading progress
 */
const ProgressIndicator = ({
    value = 0,
    max = 100,
    indeterminate = false,
    label = '',
    variant = 'linear' // 'linear' or 'circular'
}) => {
    const percentage = (value / max) * 100;

    if (variant === 'circular') {
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const offset = indeterminate ? 0 : circumference - (percentage / 100) * circumference;

        return (
            <div
                style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
                role="progressbar"
                aria-valuenow={indeterminate ? undefined : value}
                aria-valuemin="0"
                aria-valuemax={max}
                aria-label={label || 'Progress'}
            >
                <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="var(--glass-border)"
                        strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{
                            transition: indeterminate ? 'none' : 'stroke-dashoffset 0.3s ease',
                            animation: indeterminate ? 'spin 1s linear infinite' : 'none',
                        }}
                    />
                </svg>
                {!indeterminate && (
                    <span style={{
                        position: 'absolute',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                    }}>
                        {Math.round(percentage)}%
                    </span>
                )}
                {label && (
                    <span style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                    }}>
                        {label}
                    </span>
                )}
                <style>{`
                    @keyframes spin {
                        from { transform: rotate(-90deg); }
                        to { transform: rotate(270deg); }
                    }
                `}</style>
            </div>
        );
    }

    // Linear progress bar
    return (
        <div
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
            }}
        >
            {label && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                }}>
                    <span>{label}</span>
                    {!indeterminate && <span>{Math.round(percentage)}%</span>}
                </div>
            )}
            <div
                style={{
                    width: '100%',
                    height: '8px',
                    background: 'var(--glass-bg)',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    position: 'relative',
                }}
                role="progressbar"
                aria-valuenow={indeterminate ? undefined : value}
                aria-valuemin="0"
                aria-valuemax={max}
                aria-label={label || 'Progress'}
            >
                <div
                    style={{
                        height: '100%',
                        background: indeterminate
                            ? 'linear-gradient(90deg, transparent, var(--accent), transparent)'
                            : 'var(--accent)',
                        width: indeterminate ? '50%' : `${percentage}%`,
                        borderRadius: '9999px',
                        transition: indeterminate ? 'none' : 'width 0.3s ease',
                        animation: indeterminate ? 'progress-indeterminate 1.5s ease-in-out infinite' : 'none',
                    }}
                />
            </div>
            <style>{`
                @keyframes progress-indeterminate {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    );
};

export default ProgressIndicator;

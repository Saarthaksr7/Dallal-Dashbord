import React from 'react';

/**
 * Progress Bar Component
 * Shows progress for long-running operations
 * 
 * @param {number} value - Progress value (0-100)
 * @param {string} size - Size: 'sm', 'md', 'lg'
 * @param {string} variant - Color variant: 'primary', 'success', 'warning', 'danger'
 * @param {boolean} indeterminate - Show indeterminate/loading state
 * @param {string} label - Optional label text
 */
const ProgressBar = ({
    value = 0,
    size = 'md',
    variant = 'primary',
    indeterminate = false,
    label = ''
}) => {
    const sizeClasses = {
        sm: 'progress-bar-sm',
        md: 'progress-bar-md',
        lg: 'progress-bar-lg'
    };

    const variantColors = {
        primary: 'var(--accent)',
        success: 'var(--success, #10b981)',
        warning: 'var(--warning, #f59e0b)',
        danger: 'var(--danger, #ef4444)'
    };

    const clampedValue = Math.min(100, Math.max(0, value));

    return (
        <div className="progress-bar-container">
            {label && <div className="progress-bar-label">{label}</div>}
            <div className={`progress-bar ${sizeClasses[size]}`}>
                <div
                    className={`progress-bar-fill ${indeterminate ? 'progress-bar-indeterminate' : ''}`}
                    style={{
                        width: indeterminate ? '30%' : `${clampedValue}%`,
                        background: variantColors[variant]
                    }}
                    role="progressbar"
                    aria-valuenow={indeterminate ? undefined : clampedValue}
                    aria-valuemin="0"
                    aria-valuemax="100"
                />
            </div>
            {!indeterminate && (
                <div className="progress-bar-percentage">{Math.round(clampedValue)}%</div>
            )}
        </div>
    );
};

export default ProgressBar;

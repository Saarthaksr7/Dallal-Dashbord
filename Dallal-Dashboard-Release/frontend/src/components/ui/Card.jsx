import React from 'react';

const Card = ({ children, className = '', title, actions, ...props }) => {
    // Generate a unique ID if title is present to associate content
    const titleId = title ? `card-title-${Math.random().toString(36).substr(2, 9)}` : undefined;

    return (
        <div
            className={`glass-panel card ${className}`}
            {...props}
            aria-labelledby={titleId}
        >
            {(title || actions) && (
                <div className="card-header">
                    {title && <h3 id={titleId} className="card-title">{title}</h3>}
                    {actions && <div className="card-actions">{actions}</div>}
                </div>
            )}
            <div className="card-content">
                {children}
            </div>

            <style>{`
        .card {
            border-radius: 0.75rem;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .card-header {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--glass-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .card-title {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
        }
        .card-content {
            padding: 1.25rem;
        }
      `}</style>
        </div>
    );
};

export default Card;

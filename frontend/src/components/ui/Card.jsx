import React from 'react';

const Card = ({ children, className = '', title, actions, ...props }) => {
    return (
        <div className={`glass-panel card ${className}`} {...props}>
            {(title || actions) && (
                <div className="card-header">
                    {title && <h3 className="card-title">{title}</h3>}
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

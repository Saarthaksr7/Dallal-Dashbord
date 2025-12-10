import React, { useState, useRef } from 'react';
import { ExternalLink, RotateCw, Minimize2, Maximize2, X } from 'lucide-react';

const IframeCard = ({
    id,
    name,
    url,
    size,
    scale,
    expanded,
    color,
    onRemove,
    onToggleExpand,
    onUpdateSize,
    isFocused,
    focusModeActive
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const iframeRef = useRef(null);

    const handleRefresh = () => {
        if (iframeRef.current) {
            setLoading(true);
            setError(false);
            iframeRef.current.src = iframeRef.current.src;
        }
    };

    const handlePopout = () => {
        window.open(url, '_blank');
    };

    const getSizeClass = () => {
        switch (size) {
            case 'third': return 'iframe-card-third';
            case 'half': return 'iframe-card-half';
            case 'full': return 'iframe-card-full';
            default: return 'iframe-card-half';
        }
    };

    const isDimmed = focusModeActive && !isFocused;

    return (
        <div
            className={`iframe-card ${getSizeClass()} ${!expanded ? 'collapsed' : ''} ${isDimmed ? 'dimmed' : ''}`}
            style={{
                opacity: isDimmed ? 0.3 : 1,
                transition: 'opacity 0.3s ease'
            }}
        >
            {/* Header */}
            <div className="iframe-header" style={{ borderLeft: `4px solid ${color}` }}>
                <div className="iframe-title">
                    <div
                        className="status-dot"
                        style={{ backgroundColor: error ? '#ef4444' : '#22c55e' }}
                    />
                    <span>{name}</span>
                </div>

                <div className="iframe-controls">
                    {/* Size selector */}
                    <select
                        value={size}
                        onChange={(e) => onUpdateSize(id, e.target.value)}
                        className="size-selector"
                        title="Iframe size"
                    >
                        <option value="third">1/3</option>
                        <option value="half">1/2</option>
                        <option value="full">Full</option>
                    </select>

                    <button onClick={handleRefresh} title="Refresh" className="control-btn">
                        <RotateCw size={16} />
                    </button>

                    <button onClick={handlePopout} title="Open in new tab" className="control-btn">
                        <ExternalLink size={16} />
                    </button>

                    <button onClick={() => onToggleExpand(id)} title={expanded ? "Minimize" : "Expand"} className="control-btn">
                        {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>

                    <button onClick={() => onRemove(id)} title="Close" className="control-btn close-btn">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Iframe Container */}
            {expanded && (
                <div className="iframe-container">
                    {loading && (
                        <div className="iframe-loading">
                            <div className="spinner" />
                            <span>Loading {name}...</span>
                        </div>
                    )}

                    {error && (
                        <div className="iframe-error">
                            <span>Failed to load {name}</span>
                            <button onClick={handleRefresh} className="retry-btn">Retry</button>
                        </div>
                    )}

                    <iframe
                        ref={iframeRef}
                        src={url}
                        onLoad={() => setLoading(false)}
                        onError={() => {
                            setLoading(false);
                            setError(true);
                        }}
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'top left',
                            width: `${100 / scale}%`,
                            height: `${100 / scale}%`,
                            border: 'none'
                        }}
                        title={name}
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                </div>
            )}

            <style>{`
                .iframe-card {
                    background: var(--bg-card);
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .iframe-card-third {
                    grid-column: span 1;
                }

                .iframe-card-half {
                    grid-column: span 2;
                }

                .iframe-card-full {
                    grid-column: span 3;
                }

                .iframe-card.collapsed {
                    height: auto;
                }

                .iframe-card.dimmed {
                    pointer-events: none;
                }

                .iframe-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1rem;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border);
                }

                .iframe-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    font-size: 0.95rem;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .iframe-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .size-selector {
                    background: var(--bg-primary);
                    border: 1px solid var(--border);
                    color: var(--text-primary);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.85rem;
                    cursor: pointer;
                }

                .control-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                }

                .control-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                }

                .close-btn:hover {
                    color: var(--danger);
                }

                .iframe-container {
                    position: relative;
                    flex: 1;
                    min-height: 600px;
                    overflow: hidden;
                }

                .iframe-loading,
                .iframe-error {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--border);
                    border-top-color: var(--accent);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .retry-btn {
                    background: var(--accent);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                }

                @media (max-width: 1200px) {
                    .iframe-card-third,
                    .iframe-card-half {
                        grid-column: span 3;
                    }
                }

                @media (max-width: 768px) {
                    .iframe-container {
                        min-height: 400px;
                    }
                }
            `}</style>
        </div>
    );
};

export default IframeCard;

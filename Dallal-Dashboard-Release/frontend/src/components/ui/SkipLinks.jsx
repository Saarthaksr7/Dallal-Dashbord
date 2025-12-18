import React from 'react';

/**
 * SkipLinks Component
 * Provides keyboard users with quick navigation to main content areas
 * Makes application more accessible by allowing users to skip repetitive navigation
 */
const SkipLinks = () => {
    return (
        <div className="skip-links">
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>
            <a href="#navigation" className="skip-link">
                Skip to navigation
            </a>
            {/* Command palette shortcut hint */}
            <a href="#search" className="skip-link" onClick={(e) => {
                e.preventDefault();
                // Trigger command palette (Ctrl+K or Cmd+K)
                const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    ctrlKey: true,
                    metaKey: true,
                    bubbles: true
                });
                document.dispatchEvent(event);
            }}>
                Open search (Ctrl+K)
            </a>

            <style>{`
                .skip-links {
                    position: relative;
                    z-index: 9999;
                }

                .skip-link {
                    position: absolute;
                    top: -40px;
                    left: 0;
                    background: var(--accent);
                    color: white;
                    padding: 8px 16px;
                    text-decoration: none;
                    border-radius: 0 0 4px 0;
                    font-weight: 500;
                    font-size: 0.875rem;
                    z-index: 9999;
                    transition: top 0.2s ease;
                }

                .skip-link:focus {
                    top: 0;
                    outline: 2px solid white;
                    outline-offset: -2px;
                }

                .skip-link:not(:focus) {
                    clip: rect(0 0 0 0);
                    clip-path: inset(50%);
                    height: 1px;
                    overflow: hidden;
                    position: absolute;
                    white-space: nowrap;
                    width: 1px;
                }

                /* Stack skip links vertically when focused */
                .skip-link:focus + .skip-link {
                    top: 40px;
                }

                .skip-link:focus + .skip-link + .skip-link {
                    top: 80px;
                }
            `}</style>
        </div>
    );
};

export default SkipLinks;

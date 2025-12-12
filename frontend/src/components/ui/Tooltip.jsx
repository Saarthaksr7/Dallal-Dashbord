import React from 'react';

/**
 * Tooltip Component
 * Displays contextual help on hover
 * 
 * @param {React.ReactNode} children - Element to attach tooltip to
 * @param {string} content - Tooltip text content
 * @param {string} position - Position: 'top', 'bottom', 'left', 'right'
 * @param {number} delay - Delay before showing (ms)
 */
const Tooltip = ({
    children,
    content,
    position = 'top',
    delay = 200
}) => {
    const [show, setShow] = React.useState(false);
    const [timer, setTimer] = React.useState(null);
    const tooltipId = React.useMemo(() => `tooltip-${Math.random().toString(36).substr(2, 9)}`, []);

    const handleMouseEnter = () => {
        const timeout = setTimeout(() => setShow(true), delay);
        setTimer(timeout);
    };

    const handleFocus = () => {
        setShow(true);
    };

    const handleMouseLeave = () => {
        if (timer) clearTimeout(timer);
        setShow(false);
    };

    const handleBlur = () => {
        setShow(false);
    };

    // Close on Escape
    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && show) {
                setShow(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [show]);

    if (!content) return children;

    return (
        <div
            className="tooltip-wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{ display: 'inline-block', position: 'relative' }}
            aria-describedby={show ? tooltipId : undefined}
        >
            {children}
            {show && (
                <div
                    id={tooltipId}
                    className={`tooltip tooltip-${position}`}
                    role="tooltip"
                >
                    {content}
                    <div className={`tooltip-arrow tooltip-arrow-${position}`} />
                </div>
            )}
        </div>
    );
};

export default Tooltip;

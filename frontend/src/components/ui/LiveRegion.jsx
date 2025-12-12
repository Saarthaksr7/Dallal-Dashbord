import React, { useEffect, useRef } from 'react';

/**
 * LiveRegion Component
 * Provides screen reader announcements for dynamic content updates
 * 
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' (default) or 'assertive'
 * @param {boolean} atomic - Whether the entire region should be announced (default: true)
 */
const LiveRegion = ({ message, priority = 'polite', atomic = true }) => {
    const previousMessage = useRef('');

    useEffect(() => {
        // Only announce if message has changed
        if (message && message !== previousMessage.current) {
            previousMessage.current = message;
        }
    }, [message]);

    if (!message) return null;

    return (
        <div
            role="status"
            aria-live={priority}
            aria-atomic={atomic}
            className="visually-hidden"
        >
            {message}
        </div>
    );
};

/**
 * GlobalLiveRegion Component
 * A singleton live region that can be used throughout the app
 * Place this at the root level and update via a custom hook or context
 */
export const GlobalLiveRegion = () => {
    const [announcement, setAnnouncement] = React.useState({ message: '', priority: 'polite' });

    // Expose announce function globally
    useEffect(() => {
        window.announceToScreenReader = (message, priority = 'polite') => {
            setAnnouncement({ message, priority });
            // Clear after announcement
            setTimeout(() => {
                setAnnouncement({ message: '', priority: 'polite' });
            }, 1000);
        };

        return () => {
            delete window.announceToScreenReader;
        };
    }, []);

    return (
        <>
            <LiveRegion
                message={announcement.message}
                priority={announcement.priority}
            />
        </>
    );
};

export default LiveRegion;

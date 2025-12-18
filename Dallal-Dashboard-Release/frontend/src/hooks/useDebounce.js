import { useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing function calls
 * Useful for search inputs, API calls, window resize handlers, etc.
 * 
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Function} Debounced function
 * 
 * Usage:
 * const debouncedSearch = useDebounce((value) => {
 *   fetchSearchResults(value);
 * }, 500);
 * 
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 */
export function useDebounce(callback, delay = 300) {
    const timeoutRef = useRef(null);

    const debouncedFunction = useCallback(
        (...args) => {
            // Clear existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Set new timeout
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    );

    // Cleanup on unmount
    useCallback(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedFunction;
}

/**
 * Custom hook for throttling function calls
 * Ensures function is called at most once per specified time period
 * 
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Minimum time between calls in milliseconds (default: 1000ms)
 * @returns {Function} Throttled function
 * 
 * Usage:
 * const throttledScroll = useThrottle(() => {
 *   handleScroll();
 * }, 100);
 * 
 * <div onScroll={throttledScroll}>...</div>
 */
export function useThrottle(callback, delay = 1000) {
    const lastRun = useRef(Date.now());
    const timeoutRef = useRef(null);

    const throttledFunction = useCallback(
        (...args) => {
            const now = Date.now();
            const timeSinceLastRun = now - lastRun.current;

            if (timeSinceLastRun >= delay) {
                // Enough time has passed, execute immediately
                callback(...args);
                lastRun.current = now;
            } else {
                // Schedule for later
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                timeoutRef.current = setTimeout(() => {
                    callback(...args);
                    lastRun.current = Date.now();
                }, delay - timeSinceLastRun);
            }
        },
        [callback, delay]
    );

    return throttledFunction;
}

/**
 * Debounce utility function (non-hook version)
 * Can be used outside of React components
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle utility function (non-hook version)
 * Can be used outside of React components
 * 
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 1000) {
    let inThrottle;

    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;

            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

export default useDebounce;

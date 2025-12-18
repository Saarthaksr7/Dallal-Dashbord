/**
 * Accessibility Utility Functions
 * Helper functions for managing focus, screen reader announcements, and keyboard navigation
 */

/**
 * Traps focus within a container (useful for modals/dialogs)
 * @param {HTMLElement} container - The container element to trap focus within
 * @returns {Function} Cleanup function to remove event listeners
 */
export function trapFocus(container) {
    if (!container) return () => { };

    const focusableElements = container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable?.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable?.focus();
            }
        }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    firstFocusable?.focus();

    // Return cleanup function
    return () => {
        container.removeEventListener('keydown', handleTabKey);
    };
}

/**
 * Creates a live region announcement for screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announce(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);

    // Add message after a brief delay to ensure it's announced
    setTimeout(() => {
        announcement.textContent = message;
    }, 100);

    // Clean up after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

/**
 * Gets all focusable elements within a container
 * @param {HTMLElement} container - The container to search
 * @returns {NodeList} List of focusable elements
 */
export function getFocusableElements(container) {
    return container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
}

/**
 * Manages focus return after modal close
 * @param {HTMLElement} triggerElement - Element that opened the modal
 * @returns {Function} Function to call when closing modal
 */
export function createFocusReturnHandler(triggerElement) {
    return () => {
        if (triggerElement && typeof triggerElement.focus === 'function') {
            // Small delay to ensure modal is closed
            setTimeout(() => {
                triggerElement.focus();
            }, 0);
        }
    };
}

/**
 * Keyboard event helper - checks if event is Enter or Space
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
export function isActivationKey(event) {
    return event.key === 'Enter' || event.key === ' ';
}

/**
 * Creates a visually hidden element (visible to screen readers only)
 * @param {string} text - Text content
 * @returns {HTMLElement}
 */
export function createVisuallyHidden(text) {
    const element = document.createElement('span');
    element.textContent = text;
    element.className = 'visually-hidden';
    return element;
}

/**
 * Generates a unique ID for accessibility associations
 * @param {string} prefix - Prefix for the ID
 * @returns {string}
 */
let idCounter = 0;
export function generateA11yId(prefix = 'a11y') {
    return `${prefix}-${Date.now()}-${++idCounter}`;
}

import { useEffect } from 'react';

export const useKeyboardShortcuts = (keyMap) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ignore if input/textarea is focused (unless it's Esc)
            if (
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) &&
                event.key !== 'Escape'
            ) {
                return;
            }

            const { key, ctrlKey, shiftKey, altKey } = event;
            let handler = null;

            // Check specific combinations first
            // Format: "Ctrl+K", "Shift+?", "a", etc.

            // Generate key string
            const modifiers = [];
            if (ctrlKey) modifiers.push('Ctrl');
            if (shiftKey) modifiers.push('Shift');
            if (altKey) modifiers.push('Alt');

            // Handle simple key press or modifier combo
            // Should match what's in keyMap keys

            // Just iterate map
            for (const [shortcut, action] of Object.entries(keyMap)) {
                const parts = shortcut.split('+');
                const mainKey = parts[parts.length - 1];
                const requiredModifiers = parts.slice(0, -1);

                const modifiersMatch =
                    requiredModifiers.includes('Ctrl') === ctrlKey &&
                    requiredModifiers.includes('Shift') === shiftKey &&
                    requiredModifiers.includes('Alt') === altKey;

                if (modifiersMatch && key.toLowerCase() === mainKey.toLowerCase()) {
                    handler = action;
                    break;
                }
                // Handle specific characters like '?'
                if (shortcut === '?' && key === '?') {
                    handler = action;
                    break;
                }
                if (shortcut === '/' && key === '/') {
                    handler = action;
                    break;
                }
            }

            if (handler) {
                event.preventDefault();
                handler(event);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [keyMap]);
};

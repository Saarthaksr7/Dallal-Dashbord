import { useEffect } from 'react';
import { useUIStore } from '../store/ui';

const ThemeManager = () => {
    const { theme, accentColor } = useUIStore();

    useEffect(() => {
        const root = document.documentElement;

        // Handle Theme using data-theme attribute to match CSS
        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.setAttribute('data-theme', systemTheme);
        } else {
            root.setAttribute('data-theme', theme);
        }

        // Handle Accent Color
        root.style.setProperty('--accent', accentColor);

        // Optional: Add complementary colors or shades if needed
        // root.style.setProperty('--accent-hover', adjustColor(accentColor, -20)); 

    }, [theme, accentColor]);

    useEffect(() => {
        // System theme listener
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                const root = document.documentElement;
                root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    return null;
};

export default ThemeManager;

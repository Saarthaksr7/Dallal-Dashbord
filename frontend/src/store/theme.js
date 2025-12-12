import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
    persist(
        (set) => ({
            theme: 'dark', // 'light' or 'dark'

            toggleTheme: () => set((state) => {
                const newTheme = state.theme === 'dark' ? 'light' : 'dark';

                // Apply theme to document
                document.documentElement.setAttribute('data-theme', newTheme);

                return { theme: newTheme };
            }),

            setTheme: (theme) => set(() => {
                // Apply theme to document
                document.documentElement.setAttribute('data-theme', theme);

                return { theme };
            }),
        }),
        {
            name: 'dallal-theme',
            onRehydrateStorage: () => (state) => {
                // Apply theme on app load
                if (state?.theme) {
                    document.documentElement.setAttribute('data-theme', state.theme);
                }
            }
        }
    )
);

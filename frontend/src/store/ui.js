import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
    persist(
        (set, get) => ({
            sidebarCollapsed: false,
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),

            // Theme
            theme: 'dark', // default to dark
            setTheme: (value) => set({ theme: value }),
            accentColor: '#3b82f6',
            setAccentColor: (value) => set({ accentColor: value }),

            // Toasts
            toasts: [],
            addToast: (message, type = 'info', duration = 5000) => {
                const id = Date.now();
                set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
                setTimeout(() => {
                    get().removeToast(id);
                }, duration);
            },
            removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
        }),
        {
            name: 'dallal-ui-prefs',
            partialize: (state) => ({
                sidebarCollapsed: state.sidebarCollapsed,
                theme: state.theme,
                accentColor: state.accentColor
            }), // Don't persist toasts
        }
    )
);

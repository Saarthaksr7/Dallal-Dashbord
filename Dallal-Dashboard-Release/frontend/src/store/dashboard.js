import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDashboardStore = create(
    persist(
        (set, get) => ({
            // Favorites - array of service IDs
            favorites: [],

            // Widget preferences
            widgetLayout: {
                overview: ['status', 'alerts', 'uptime'],
                favorites: []
            },

            // Add service to favorites
            addFavorite: (serviceId) => set((state) => {
                if (!state.favorites.includes(serviceId)) {
                    return { favorites: [...state.favorites, serviceId] };
                }
                return state;
            }),

            // Remove service from favorites
            removeFavorite: (serviceId) => set((state) => ({
                favorites: state.favorites.filter(id => id !== serviceId)
            })),

            // Toggle favorite
            toggleFavorite: (serviceId) => {
                const { favorites } = get();
                if (favorites.includes(serviceId)) {
                    get().removeFavorite(serviceId);
                } else {
                    get().addFavorite(serviceId);
                }
            },

            // Check if service is favorited
            isFavorite: (serviceId) => {
                return get().favorites.includes(serviceId);
            },

            // Reorder favorites (for drag-and-drop)
            reorderFavorites: (newOrder) => set({ favorites: newOrder }),

            // Update widget layout
            updateWidgetLayout: (page, layout) => set((state) => ({
                widgetLayout: {
                    ...state.widgetLayout,
                    [page]: layout
                }
            })),

            // Clear all favorites
            clearFavorites: () => set({ favorites: [] })
        }),
        {
            name: 'dallal-dashboard-storage',
            partialize: (state) => ({
                favorites: state.favorites,
                widgetLayout: state.widgetLayout
            })
        }
    )
);

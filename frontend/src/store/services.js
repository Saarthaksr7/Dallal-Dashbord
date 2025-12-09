import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export const useServicesStore = create(
    persist(
        (set, get) => {
            let visibilityHandler = null; // Closure variable for this store instance

            return {
                services: [],
                lastUpdated: null,
                loading: false,
                error: null,
                pollingIntervalId: null,

                setServices: (services) => set({ services, lastUpdated: new Date().toISOString() }),

                fetchServices: async (silent = false) => {
                    if (!silent) set({ loading: true, error: null });
                    try {
                        const res = await api.get('/services/');
                        set({
                            services: res.data,
                            lastUpdated: new Date().toISOString(),
                            loading: false,
                            error: null
                        });
                    } catch (error) {
                        console.error("Fetch services failed", error);
                        set({
                            loading: false,
                            error: silent ? null : "Failed to sync data. Showing cached version."
                        });
                    }
                },

                addService: (service) => set((state) => ({ services: [...state.services, service] })),
                updateService: (updated) => set((state) => ({
                    services: state.services.map(s => s.id === updated.id ? updated : s)
                })),
                removeService: (id) => set((state) => ({
                    services: state.services.filter(s => s.id !== id)
                })),

                startPolling: () => {
                    const { pollingIntervalId } = get();
                    if (pollingIntervalId || visibilityHandler) return; // Already setup

                    const runPoll = () => {
                        const id = setInterval(() => get().fetchServices(true), 5000);
                        set({ pollingIntervalId: id });
                    };

                    const stopPoll = () => {
                        const { pollingIntervalId } = get();
                        if (pollingIntervalId) {
                            clearInterval(pollingIntervalId);
                            set({ pollingIntervalId: null });
                        }
                    };

                    visibilityHandler = () => {
                        if (document.hidden) stopPoll();
                        else {
                            get().fetchServices(true); // Update immediately on visible
                            runPoll();
                        }
                    };

                    document.addEventListener('visibilitychange', visibilityHandler);
                    if (!document.hidden) {
                        get().fetchServices(true);
                        runPoll();
                    }
                },

                stopPolling: () => {
                    const { pollingIntervalId } = get();
                    if (pollingIntervalId) clearInterval(pollingIntervalId);

                    if (visibilityHandler) {
                        document.removeEventListener('visibilitychange', visibilityHandler);
                        visibilityHandler = null;
                    }
                    set({ pollingIntervalId: null });
                }
            };
        },
        {
            name: 'dallal-services-storage',
            partialize: (state) => ({ services: state.services, lastUpdated: state.lastUpdated }),
        }
    )
);

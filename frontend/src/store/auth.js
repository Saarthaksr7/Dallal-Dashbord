import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (username, password) => {
                set({ isLoading: true, error: null });
                try {
                    // OAuth2PasswordRequestForm expects form-data
                    const formData = new FormData();
                    formData.append('username', username);
                    formData.append('password', password);

                    const response = await api.post('/login/access-token', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    set({
                        token: response.data.access_token,
                        user: { role: response.data.role }, // Store role
                        isAuthenticated: true,
                        isLoading: false
                    });

                    // Fetch full user details (preferences, etc)
                    await get().fetchUser();

                } catch (error) {
                    const msg = error.response?.data?.detail || 'Login failed';
                    set({ error: msg, isLoading: false, isAuthenticated: false, token: null });
                    throw error;
                }
            },

            fetchUser: async () => {
                try {
                    const res = await api.post('/login/test-token');
                    set((state) => ({ user: { ...state.user, ...res.data } }));
                } catch (e) {
                    console.error("Fetch user failed", e);
                }
            },

            updatePreferences: async (newPrefs) => {
                try {
                    const oldUser = get().user;
                    const mergedPrefs = { ...(oldUser?.preferences || {}), ...newPrefs };
                    const updatedUser = { ...oldUser, preferences: mergedPrefs };

                    set({ user: updatedUser }); // Optimistic update

                    await api.patch('/users/me/preferences', mergedPrefs);
                } catch (e) {
                    console.error("Update prefs failed", e);
                    // set({ user: oldUser }); // Revert if needed, but low risk for prefs
                }
            },

            logout: () => {
                set({ token: null, user: null, isAuthenticated: false });
            },
        }),
        {
            name: 'dallal-auth', // name of item in localStorage
            partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated, user: state.user }), // Persist user too
        }
    )
);

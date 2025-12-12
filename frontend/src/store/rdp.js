import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export const useRDPStore = create(
    persist(
        (set, get) => ({
            // State
            sessions: [],
            recordings: [],
            loading: false,
            error: null,
            selectedSession: null,

            // Actions
            fetchSessions: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await api.get('/rdp/sessions');
                    set({ sessions: response.data, loading: false });
                } catch (error) {
                    console.error('Fetch sessions failed', error);
                    set({ error: error.response?.data?.detail || 'Failed to fetch sessions', loading: false });
                }
            },

            createSession: async (sessionData) => {
                set({ loading: true, error: null });
                try {
                    const response = await api.post('/rdp/sessions', sessionData);
                    const newSession = response.data;

                    // Add to sessions list
                    set(state => ({
                        sessions: [newSession, ...state.sessions],
                        loading: false
                    }));

                    return newSession;
                } catch (error) {
                    console.error('Create session failed', error);
                    set({ error: error.response?.data?.detail || 'Failed to create session', loading: false });
                    throw error;
                }
            },

            updateSession: async (sessionId, updateData) => {
                set({ loading: true, error: null });
                try {
                    await api.put(`/rdp/sessions/${sessionId}`, updateData);

                    // Update in sessions list
                    set(state => ({
                        sessions: state.sessions.map(s =>
                            s.id === sessionId ? { ...s, ...updateData } : s
                        ),
                        loading: false
                    }));
                } catch (error) {
                    console.error('Update session failed', error);
                    set({ error: error.response?.data?.detail || 'Failed to update session', loading: false });
                    throw error;
                }
            },

            deleteSession: async (sessionId) => {
                set({ loading: true, error: null });
                try {
                    await api.delete(`/rdp/sessions/${sessionId}`);

                    // Remove from sessions list
                    set(state => ({
                        sessions: state.sessions.filter(s => s.id !== sessionId),
                        loading: false
                    }));
                } catch (error) {
                    console.error('Delete session failed', error);
                    set({ error: error.response?.data?.detail || 'Failed to delete session', loading: false });
                    throw error;
                }
            },

            connectSession: async (sessionId) => {
                set({ loading: true, error: null });
                try {
                    const response = await api.post(`/rdp/sessions/${sessionId}/connect`);

                    // Update session status
                    set(state => ({
                        sessions: state.sessions.map(s =>
                            s.id === sessionId ? { ...s, status: 'connecting' } : s
                        ),
                        loading: false
                    }));

                    return response.data;
                } catch (error) {
                    console.error('Connect session failed', error);
                    set({ error: error.response?.data?.detail || 'Failed to connect', loading: false });
                    throw error;
                }
            },

            disconnectSession: async (sessionId) => {
                set({ loading: true, error: null });
                try {
                    const response = await api.post(`/rdp/sessions/${sessionId}/disconnect`);

                    // Update session status
                    set(state => ({
                        sessions: state.sessions.map(s =>
                            s.id === sessionId ? { ...s, status: 'disconnected', ended_at: new Date().toISOString() } : s
                        ),
                        loading: false
                    }));

                    return response.data;
                } catch (error) {
                    console.error('Disconnect session failed', error);
                    set({ error: error.response?.data?.detail || 'Failed to disconnect', loading: false });
                    throw error;
                }
            },

            // Recordings
            fetchRecordings: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await api.get('/rdp/recordings');
                    set({ recordings: response.data, loading: false });
                } catch (error) {
                    console.error('Fetch recordings failed', error);
                    set({ error: error.response?.data?.detail || 'Failed to fetch recordings', loading: false });
                }
            },

            deleteRecording: async (recordingId) => {
                set({ loading: true, error: null });
                try {
                    await api.delete(`/rdp/recordings/${recordingId}`);

                    // Remove from recordings list
                    set(state => ({
                        recordings: state.recordings.filter(r => r.id !== recordingId),
                        loading: false
                    }));
                } catch (error) {
                    console.error('Delete recording failed', error);
                    set({ error: error.response?.data?.detail || 'Failed to delete recording', loading: false });
                    throw error;
                }
            },

            // Utility
            setSelectedSession: (session) => set({ selectedSession: session }),
            clearError: () => set({ error: null }),
        }),
        {
            name: 'dallal-rdp',
            partialize: (state) => ({
                // Don't persist loading or error states
                sessions: state.sessions,
                recordings: state.recordings
            })
        }
    )
);

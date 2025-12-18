import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export const useRDPStore = create(
    persist(
        (set, get) => ({
            // State
            sessions: [],
            recordings: [],
            profiles: [],  // Connection profiles
            loading: false,
            error: null,
            selectedSession: null,
            selectedProfile: null,

            // Session Actions
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

            // Connection Profile Actions
            fetchProfiles: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await api.get('/rdp/profiles');
                    set({ profiles: response.data, loading: false });
                } catch (error) {
                    console.error('Fetch profiles failed', error);
                    set({ error: error.response?.data?.detail || 'Failed to fetch profiles', loading: false });
                }
            },

            createProfile: async (profileData) => {
                set({ loading: true, error: null });
                try {
                    const response = await api.post('/rdp/profiles', profileData);
                    const newProfile = response.data;

                    // Add to profiles list
                    set(state => ({
                        profiles: [newProfile, ...state.profiles],
                        loading: false
                    }));

                    return newProfile;
                } catch (error) {
                    console.error('Create profile failed', error);
                    set({ error: error.response?.data?.detail || 'Failed to create profile', loading: false });
                    throw error;
                }
            },

            updateProfile: async (profileId, updateData) => {
                set({ loading: true, error: null });
                try {
                    await api.put(`/rdp/profiles/${profileId}`, updateData);

                    // Update in profiles list
                    set(state => ({
                        profiles: state.profiles.map(p =>
                            p.id === profileId ? { ...p, ...updateData, updated_at: new Date().toISOString() } : p
                        ),
                        loading: false
                    }));
                } catch (error) {
                    console.error('Update profile failed', error);
                    set({ error: error.response?.data?.detail || 'Failed to update profile', loading: false });
                    throw error;
                }
            },

            deleteProfile: async (profileId) => {
                set({ loading: true, error: null });
                try {
                    await api.delete(`/rdp/profiles/${profileId}`);

                    // Remove from profiles list
                    set(state => ({
                        profiles: state.profiles.filter(p => p.id !== profileId),
                        loading: false
                    }));
                } catch (error) {
                    console.error('Delete profile failed', error);
                    set({ error: error.response?.data?.detail || 'Failed to delete profile', loading: false });
                    throw error;
                }
            },

            checkProfileStatus: async (profileId) => {
                try {
                    const response = await api.get(`/rdp/profiles/${profileId}/status`);
                    const statusData = response.data;

                    // Update profile status in state
                    set(state => ({
                        profiles: state.profiles.map(p =>
                            p.id === profileId ? { ...p, is_online: statusData.is_online, last_online_check: statusData.last_check } : p
                        )
                    }));

                    return statusData;
                } catch (error) {
                    console.error('Check profile status failed', error);
                    return null;
                }
            },

            testConnection: async (hostname, port = 3389) => {
                try {
                    const response = await api.post('/rdp/profiles/test-connection', { hostname, port });
                    return response.data;
                } catch (error) {
                    console.error('Test connection failed', error);
                    throw error;
                }
            },

            downloadRDPFile: async (profileId, includePassword = false) => {
                try {
                    const response = await api.get(`/rdp/profiles/${profileId}/download-rdp`, {
                        params: { include_password: includePassword },
                        responseType: 'blob'
                    });

                    // Create download link
                    const blob = new Blob([response.data], { type: 'application/x-rdp' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;

                    // Extract filename from Content-Disposition header or use default
                    const contentDisposition = response.headers['content-disposition'];
                    let filename = 'connection.rdp';
                    if (contentDisposition) {
                        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                        if (matches != null && matches[1]) {
                            filename = matches[1].replace(/['"]/g, '');
                        }
                    }

                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    return true;
                } catch (error) {
                    console.error('Download RDP file failed', error);
                    set({ error: 'Failed to download RDP file' });
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
            setSelectedProfile: (profile) => set({ selectedProfile: profile }),
            clearError: () => set({ error: null }),
        }),
        {
            name: 'dallal-rdp',
            partialize: (state) => ({
                // Don't persist loading or error states
                sessions: state.sessions,
                recordings: state.recordings,
                profiles: state.profiles
            })
        }
    )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultSettings = {
    smtp: {
        enabled: false,
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: '',
            pass: ''
        }
    },
    from: {
        name: 'Dallal Dashboard',
        email: ''
    },
    recipients: {
        default: [],
        critical: [],
        warning: [],
        info: []
    },
    preferences: {
        sendDigest: false,
        digestFrequency: 'daily',
        includeMetrics: true,
        includeCharts: false
    }
};

export const useEmailSettingsStore = create(
    persist(
        (set, get) => ({
            ...defaultSettings,

            updateSMTP: (config) => set((state) => ({
                smtp: { ...state.smtp, ...config }
            })),

            updateFrom: (from) => set((state) => ({
                from: { ...state.from, ...from }
            })),

            updateRecipients: (recipients) => set((state) => ({
                recipients: { ...state.recipients, ...recipients }
            })),

            addRecipient: (severity, email) => set((state) => ({
                recipients: {
                    ...state.recipients,
                    [severity]: [...state.recipients[severity], email]
                }
            })),

            removeRecipient: (severity, email) => set((state) => ({
                recipients: {
                    ...state.recipients,
                    [severity]: state.recipients[severity].filter(e => e !== email)
                }
            })),

            updatePreferences: (prefs) => set((state) => ({
                preferences: { ...state.preferences, ...prefs }
            })),

            // Test email function - calls backend
            sendTestEmail: async (testEmail) => {
                const state = get();

                try {
                    const response = await fetch('/api/notifications/test', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            smtp: state.smtp,
                            from: state.from,
                            to: testEmail || state.smtp.auth.user
                        })
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.detail || 'Failed to send test email');
                    }

                    return {
                        success: true,
                        message: result.message || 'Test email sent successfully!'
                    };
                } catch (error) {
                    console.error('Test email error:', error);
                    return {
                        success: false,
                        message: error.message || 'Failed to send test email'
                    };
                }
            },

            // Save settings to backend
            saveToBackend: async () => {
                const state = get();

                try {
                    const response = await fetch('/api/notifications/settings', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            smtp: state.smtp,
                            from: state.from,
                            recipients: state.recipients,
                            preferences: state.preferences
                        })
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.detail || 'Failed to save settings');
                    }

                    return { success: true };
                } catch (error) {
                    console.error('Save settings error:', error);
                    return {
                        success: false,
                        message: error.message
                    };
                }
            },

            resetSettings: () => set(defaultSettings)
        }),
        {
            name: 'email-settings',
        }
    )
);

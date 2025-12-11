// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

export const config = {
    // API URLs
    apiBaseUrl: API_BASE_URL,
    apiUrl: `${API_BASE_URL}/api/${API_VERSION}`,
    wsUrl: import.meta.env.VITE_WS_URL || `ws${API_BASE_URL.replace(/^http/, '')}`,

    // Application
    appName: import.meta.env.VITE_APP_NAME || 'Dallal Dashboard',
    appVersion: import.meta.env.VITE_APP_VERSION || '2.0.0',
    environment: import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development',

    // Feature Flags
    features: {
        docker: import.meta.env.VITE_ENABLE_DOCKER !== 'false',
        ssh: import.meta.env.VITE_ENABLE_SSH !== 'false',
        rdp: import.meta.env.VITE_ENABLE_RDP !== 'false',
        topology: import.meta.env.VITE_ENABLE_TOPOLOGY !== 'false',
        analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
        serviceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true'
    },

    // Monitoring
    monitoring: {
        sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
        gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID || ''
    },

    // UI Settings
    ui: {
        defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'dark',
        defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || 'en'
    },

    // Security & Session
    security: {
        sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 60, // minutes
        tokenRefreshBuffer: parseint(import.meta.env.VITE_TOKEN_REFRESH_BUFFER) || 5 // minutes
    },

    // Performance
    performance: {
        apiTimeout: API_TIMEOUT,
        debounceDelay: 300, // ms
        throttleDelay: 1000 // ms
    },

    // Development
    isDevelopment: import.meta.env.DEV || false,
    isProduction: import.meta.env.PROD || false,
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV
};

// Helper functions
export const getApiUrl = (endpoint) => {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${config.apiUrl}/${cleanEndpoint}`;
};

export const isFeatureEnabled = (feature) => {
    return config.features[feature] === true;
};

// Log configuration in development
if (config.isDevelopment) {
    console.log('[Config] Application configuration:', config);
}

export default config;

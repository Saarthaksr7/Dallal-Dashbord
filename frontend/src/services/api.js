/**
 * Enhanced API client with caching, deduplication, and retry logic
 */
import axios from 'axios';
import config from '../config';

// Request cache to prevent duplicate simultaneous requests
const pendingRequests = new Map();
const responseCache = new Map();

// Configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Create axios instance
const apiClient = axios.create({
    baseURL: config.apiUrl,
    timeout: config.performance.apiTimeout,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors and refresh token
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 - Unauthorized (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh token (implement this based on your auth system)
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${config.apiUrl}/auth/refresh`, {
                        refresh_token: refreshToken
                    });

                    const { access_token } = response.data;
                    localStorage.setItem('token', access_token);

                    // Retry original request
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Generate cache key from request config
 */
function getCacheKey(method, url, params, data) {
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
}

/**
 * Check if response is in cache and still valid
 */
function getCachedResponse(cacheKey) {
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    responseCache.delete(cacheKey);
    return null;
}

/**
 * Sleep utility for retry delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make API request with caching and deduplication
 */
async function makeRequest(method, url, options = {}) {
    const {
        params,
        data,
        cache = method === 'GET', // Cache GET requests by default
        deduplicate = true, // Deduplicate simultaneous requests
        retry = true, // Retry on failure
        ...axiosConfig
    } = options;

    const cacheKey = getCacheKey(method, url, params, data);

    // Check cache for GET requests
    if (cache && method === 'GET') {
        const cachedResponse = getCachedResponse(cacheKey);
        if (cachedResponse) {
            if (config.debugMode) {
                console.log('[API] Cache HIT:', url);
            }
            return Promise.resolve(cachedResponse);
        }
    }

    // Check for pending identical request (deduplication)
    if (deduplicate && pendingRequests.has(cacheKey)) {
        if (config.debugMode) {
            console.log('[API] Request deduplicated:', url);
        }
        return pendingRequests.get(cacheKey);
    }

    // Make request with retry logic
    const requestPromise = (async () => {
        let lastError;
        const maxRetries = retry ? MAX_RETRIES : 1;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (config.debugMode) {
                    console.log(`[API] ${method} ${url}`, attempt > 1 ? `(retry ${attempt}/${maxRetries})` : '');
                }

                const response = await apiClient({
                    method,
                    url,
                    params,
                    data,
                    ...axiosConfig,
                });

                // Cache successful GET responses
                if (cache && method === 'GET') {
                    responseCache.set(cacheKey, {
                        data: response.data,
                        timestamp: Date.now(),
                    });
                }

                return response.data;

            } catch (error) {
                lastError = error;

                // Don't retry on 4xx errors (client errors)
                if (error.response && error.response.status >= 400 && error.response.status < 500) {
                    break;
                }

                // Wait before retrying (exponential backoff)
                if (attempt < maxRetries) {
                    await sleep(RETRY_DELAY * Math.pow(2, attempt - 1));
                }
            }
        }

        throw lastError;

    })().finally(() => {
        // Remove from pending requests
        pendingRequests.delete(cacheKey);
    });

    // Store pending request
    if (deduplicate) {
        pendingRequests.set(cacheKey, requestPromise);
    }

    return requestPromise;
}

/**
 * API methods
 */
export const api = {
    // GET request
    get: (url, options = {}) => makeRequest('GET', url, options),

    // POST request
    post: (url, data, options = {}) => makeRequest('POST', url, { ...options, data }),

    // PUT request
    put: (url, data, options = {}) => makeRequest('PUT', url, { ...options, data }),

    // PATCH request
    patch: (url, data, options = {}) => makeRequest('PATCH', url, { ...options, data }),

    // DELETE request
    delete: (url, options = {}) => makeRequest('DELETE', url, options),

    // Clear cache
    clearCache: () => {
        responseCache.clear();
        if (config.debugMode) {
            console.log('[API] Cache cleared');
        }
    },

    // Clear specific cache entry
    clearCacheEntry: (method, url, params, data) => {
        const cacheKey = getCacheKey(method, url, params, data);
        responseCache.delete(cacheKey);
    },

    // Cancel all pending requests
    cancelPending: () => {
        pendingRequests.clear();
        if (config.debugMode) {
            console.log('[API] Pending requests cancelled');
        }
    },
};

/**
 * Convenience methods for common API endpoints
 */
export const serviceAPI = {
    getAll: () => api.get('/services'),
    getById: (id) => api.get(`/services/${id}`),
    create: (data) => api.post('/services', data),
    update: (id, data) => api.put(`/services/${id}`, data),
    delete: (id) => api.delete(`/services/${id}`),
};

export const dockerAPI = {
    getInfo: () => api.get('/docker/info', { cache: true }),
    getContainers: () => api.get('/docker/containers'),
    startContainer: (id) => api.post(`/docker/containers/${id}/start`),
    stopContainer: (id) => api.post(`/docker/containers/${id}/stop`),
    restartContainer: (id) => api.post(`/docker/containers/${id}/restart`),
};

export const monitoringAPI = {
    getMetrics: (serviceId, range = '24h') => api.get(`/services/${serviceId}/metrics`, {
        params: { range },
        cache: true
    }),
    getAlerts: (filters) => api.get('/monitoring/alerts', { params: filters }),
};

export default api;

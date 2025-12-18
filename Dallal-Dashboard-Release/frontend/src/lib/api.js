import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';

export const BASE_URL = 'http://localhost:8000';

// Create Axios Instance
export const api = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor to add Bearer Token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const msg = error.response?.data?.detail || error.message;
        const addToast = (m) => useUIStore.getState().addToast(m, 'error');

        if (!error.response) {
            // Network Error or Server Down
            addToast("Network Error: Cannot connect to server.");
        } else if (error.response.status === 401) {
            useAuthStore.getState().logout();
            // Optional: addToast("Session expired");
        } else if (error.response.status === 429) {
            addToast("Too many requests. Please wait a moment.");
        } else if (error.response.status >= 500) {
            addToast(`Server Error: ${msg}`);
        } else {
            // 4xx errors
            if (error.response.status !== 404) {
                addToast(typeof msg === 'string' ? msg : "An error occurred");
            }
        }
        return Promise.reject(error);
    }
);

export const createService = async (data) => {
    const response = await api.post('/services/', data);
    return response.data;
};

export const scanNetwork = async () => {
    const response = await api.post('/services/discovery/scan');
    return response.data;
};

// WOL
export const wakeService = async (serviceId) => {
    const response = await api.post(`/services/${serviceId}/wake`);
    return response.data;
};

export const sendWOL = async (mac, ip = "255.255.255.255", port = 9) => {
    const response = await api.post('/wol/wake', { mac_address: mac, broadcast_ip: ip, port });
    return response.data;
};

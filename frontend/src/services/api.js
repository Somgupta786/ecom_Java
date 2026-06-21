import axios from 'axios';

let activeAccessToken = null;

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials: true
});

export const setAccessToken = (token) => {
    activeAccessToken = token;
};

// Automatically inject JWT Bearer Token if it exists in memory
api.interceptors.request.use(
    (config) => {
        if (activeAccessToken) {
            config.headers['Authorization'] = `Bearer ${activeAccessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh on 401 errors
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Avoid loops if the login or refresh requests themselves fail
            if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Perform silent refresh call to backend (sends HttpOnly cookie)
                const res = await axios.post('http://localhost:8080/api/auth/refresh', {}, {
                    withCredentials: true
                });
                const { accessToken } = res.data;

                setAccessToken(accessToken);

                // Update original request headers and execute queue
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                processQueue(null, accessToken);

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                setAccessToken(null);
                // Dispatch event so AuthContext knows to clear local state
                window.dispatchEvent(new Event('auth-expired'));
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;

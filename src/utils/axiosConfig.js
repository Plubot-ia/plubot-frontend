import axios from 'axios';
import useAuthStore from '@/stores/useAuthStore';

const isDevelopment = import.meta.env.MODE === 'development';
const prodApiUrl = import.meta.env.VITE_API_URL || 'https://plubot-backend.onrender.com';

// Lógica robusta para construir la baseURL de producción
let finalProdApiUrl = prodApiUrl;
if (finalProdApiUrl.endsWith('/')) {
  finalProdApiUrl = finalProdApiUrl.slice(0, -1); // Eliminar barra final si existe
}
if (!finalProdApiUrl.endsWith('/api')) {
  finalProdApiUrl = `${finalProdApiUrl}/api`; // Añadir /api si no existe
}

const baseURL = isDevelopment ? '/api' : finalProdApiUrl;

const instance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 20000,
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  }
});

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

instance.interceptors.request.use(
  (config) => {
        const publicEndpoints = ['auth/login', 'auth/register', 'contact', 'opinion'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('Session expired: No refresh token');
        }

        const { data } = await instance.post('auth/refresh', { refresh_token: refreshToken });

        if (data && data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          sessionStorage.setItem('access_token', data.access_token);
          instance.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
          
          processQueue(null, data.access_token);

          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return instance(originalRequest);
        }
        throw new Error('Session expired: Could not refresh token');

      } catch (refreshError) {
        useAuthStore.getState().logout();
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
        
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;
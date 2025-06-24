import axios from 'axios';

import { emitEvent } from './eventBus';


const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = (import.meta.env.VITE_API_URL || 'https://plubot-backend.onrender.com').trim();

// Normalizar la URL base: eliminar cualquier barra final y el sufijo '/api' si existe.
const baseApiUrl = apiUrl.replace(/\/+$/, '').replace(/\/api$/, '');

// En desarrollo, usamos el proxy de Vite. En producción, construimos la URL completa asegurando que '/api' esté presente solo una vez.
const baseURL = isDevelopment ? '/api' : `${baseApiUrl}/api`;

const instance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 20000,
  validateStatus(status) {
    return status >= 200 && status < 500;
  },
});

let refreshTokenPromise = null;

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
  },
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no es un reintento
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!refreshTokenPromise) {
        // Marcar este reintento para evitar bucles infinitos
        originalRequest._retry = true;

        // Iniciar la promesa de actualización del token
        refreshTokenPromise = new Promise((resolve, reject) => {
          (async () => {
            try {
              const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
              if (!refreshToken) {
                throw new Error('Session expired: No refresh token');
              }

              const { data } = await instance.post('auth/refresh', { refresh_token: refreshToken });

              if (data && data.access_token) {
                const newAccessToken = data.access_token;
                localStorage.setItem('access_token', newAccessToken);
                sessionStorage.setItem('access_token', newAccessToken);
                resolve(newAccessToken);
              } else {
                throw new Error('Session expired: Could not refresh token');
              }
            } catch (refreshError) {
              // Si la actualización falla, desloguear al usuario
              emitEvent('auth:logout');
              reject(refreshError);
            } finally {
              // Limpiar la promesa para futuros reintentos
              refreshTokenPromise = null;
            }
          })();
        });
      }

      try {
        // Esperar a que la promesa de actualización del token se resuelva
        const newAccessToken = await refreshTokenPromise;
        // Actualizar la cabecera de la solicitud original y reintentarla
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (e) {
        // Si la actualización del token falla, rechazar la promesa
        return Promise.reject(e);
      }
    }

    // Para cualquier otro error, simplemente lo rechazamos
    return Promise.reject(error);
  },
);

export default instance;
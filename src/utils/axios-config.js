import axios from 'axios';

import { emitEvent } from './event-bus';

const isDevelopment = import.meta.env.MODE === 'development';
const apiUrl = (
  import.meta.env.VITE_API_URL || 'https://plubot-backend.onrender.com'
).trim();

// Normalizar la URL base de forma segura: se elimina cualquier barra final y el sufijo '/api'.
// Se evita una expresión regular vulnerable (ReDoS) usando un bucle.
let baseApiUrl = apiUrl;
while (baseApiUrl.endsWith('/')) {
  baseApiUrl = baseApiUrl.slice(0, -1);
}
baseApiUrl = baseApiUrl.replace(/\/api$/, '');

// En desarrollo, usamos el proxy de Vite. En producción, construimos la URL completa
// asegurando que '/api' esté presente solo una vez.
const baseURL = isDevelopment ? '/api' : `${baseApiUrl}/api`;

const instance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 20_000,
  validateStatus(status) {
    return status >= 200 && status < 500;
  },
});

let refreshTokenPromise;

instance.interceptors.request.use(
  (config) => {
    const publicEndpoints = [
      'auth/login',
      'auth/register',
      'contact',
      'opinion',
    ];
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint),
    );

    if (!isPublicEndpoint) {
      const token =
        localStorage.getItem('access_token') ||
        sessionStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // If no token is found for a private endpoint, we reject the request
        // to prevent sending an unauthenticated request.
        return Promise.reject(
          new Error('Authentication token not found. Request canceled.'),
        );
      }
    }
    return config;
  },
  // eslint-disable-next-line promise/no-promise-in-callback
  (error) => Promise.reject(error),
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
              const refreshToken =
                localStorage.getItem('refresh_token') ||
                sessionStorage.getItem('refresh_token');
              if (!refreshToken) {
                throw new Error('Session expired: No refresh token');
              }

              const { data } = await instance.post('auth/refresh', {
                refresh_token: refreshToken,
              });

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
              refreshTokenPromise = undefined;
            }
          })();
        });
      }

      // Esperar a que la promesa de actualización del token se resuelva.
      // Si la promesa se rechaza (la actualización del token falló), el `await` lanzará
      // el error, que será capturado por el interceptor de respuesta y propagado.
      const newAccessToken = await refreshTokenPromise;

      // Actualizar la cabecera de la solicitud original y reintentarla.
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return instance(originalRequest);
    }

    // Para cualquier otro error, simplemente lo rechazamos
    throw error;
  },
);

export default instance;

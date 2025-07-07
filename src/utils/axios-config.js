import axios from 'axios';

import { emitEvent } from './event-bus';

// Determina la URL base de la API a partir de las variables de entorno de Vite.
// En desarrollo, las solicitudes irán al proxy de Vite. En producción, a la URL completa.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Permite el envío de cookies, crucial para sesiones
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 20_000, // Timeout de 20 segundos para las solicitudes
});

// Interceptor de Solicitudes: Adjunta el token de autenticación a las cabeceras.
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Si existe un token, lo añade a la cabecera de autorización.
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Si hay un error en la configuración de la solicitud, se rechaza la promesa.
    return Promise.reject(error);
  },
);

// Interceptor de Respuestas: Maneja errores, especialmente para refrescar tokens.
instance.interceptors.response.use(
  // Si la respuesta es exitosa, la devuelve directamente.
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Manejo de error de autenticación (401) para refrescar el token.
    // Se comprueba `!originalRequest._retry` para evitar bucles infinitos de reintentos.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marca la solicitud como reintentada.

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // Si no hay refresh token, se emite un evento de logout y se rechaza.
          emitEvent('auth:logout');
          return Promise.reject(new Error('No refresh token available.'));
        }

        // Solicita un nuevo access token usando el refresh token.
        const response = await instance.post('/auth/refresh', {
          refresh_token: refreshToken,
        });

        const { access_token: newAccessToken } = response.data;

        if (newAccessToken) {
          // Almacena el nuevo token y actualiza la cabecera de la solicitud original.
          localStorage.setItem('access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          // Reintenta la solicitud original con el nuevo token.
          return instance(originalRequest);
        }
      } catch (refreshError) {
        // Si el refresco del token falla, se desloguea al usuario.
        emitEvent('auth:logout');
        return Promise.reject(refreshError);
      }
    }

    // Para cualquier otro tipo de error, se rechaza la promesa.
    return Promise.reject(error);
  },
);

export default instance;


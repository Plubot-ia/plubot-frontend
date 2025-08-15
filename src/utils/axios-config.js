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
  (configuration) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Si existe un token, lo añade a la cabecera de autorización.
      configuration.headers.Authorization = `Bearer ${token}`;
    }
    return configuration;
  },
  (error) => {
    // Si hay un error en la configuración de la solicitud, se lanza para que sea capturado.
    throw error;
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
    // Se añade `originalRequest.url !== '/auth/refresh'` para evitar que el interceptor
    // intente refrescar el token cuando la propia llamada de refresco falla.
    if (
      error.response?.status === 401 &&
      originalRequest.url !== '/auth/refresh' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // Si no hay token de refresco, es un logout definitivo.
        emitEvent('auth:logout');
        throw error;
      }

      try {
        // Intentamos obtener un nuevo token de acceso.
        const { data } = await instance.post('/auth/refresh', {
          refresh_token: refreshToken,
        });

        const { access_token: newAccessToken, refresh_token: newRefreshToken } = data;
        localStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Reintentamos la solicitud original con el nuevo token.
        return instance(originalRequest);
      } catch (refreshError) {
        // Si el refresco falla (e.g., token de refresco inválido), es un logout definitivo.
        emitEvent('auth:logout');
        throw refreshError;
      }
    }

    // Para cualquier otro error (no 401) o si el reintento ya falló, se rechaza la promesa.
    throw error;
  },
);

export default instance;

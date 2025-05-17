import { useState, useCallback } from 'react';
import instance from '../utils/axiosConfig';

const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para verificar si el token JWT ha expirado
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      // Decodificar el token JWT (formato: header.payload.signature)
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Verificar si el token ha expirado
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      console.error('Error al verificar el token:', e);
      return true;
    }
  };

  // Función para intentar renovar el token
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return null;
      
      const response = await instance({
        method: 'POST',
        url: '/api/auth/refresh',
        data: { refresh_token: refreshToken },
      });
      
      if (response.data && response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        return response.data.access_token;
      }
      return null;
    } catch (err) {
      console.error('Error al renovar el token:', err);
      return null;
    }
  };

  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      let token = localStorage.getItem('access_token');
      
      // Verificar si el token ha expirado
      if (token && isTokenExpired(token)) {
        console.log('Token expirado, intentando renovar...');
        token = await refreshToken();
        
        if (!token) {
          // Si no se pudo renovar el token, redirigir al login
          console.error('No se pudo renovar el token. Redirigiendo al login...');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/auth/login?expired=true';
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
      }
      
      // Configurar cabeceras
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(config.headers || {})
      };

      // Para depuración
      console.log(`Enviando petición a ${url} con datos:`, data);
      console.log('Cabeceras de la petición:', headers);

      const response = await instance({
        method,
        url,
        data: data ? JSON.stringify(data) : null,
        ...config,
        headers,
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const status = err.response?.status || 'unknown';
      const errorMessage = err.response?.data?.message || err.message || 'Error en la solicitud';
      
      // Log detallado del error
      console.error(`Request failed: ${method} ${url}`);
      console.error(`Status: ${status}`);
      console.error(`Message: ${errorMessage}`);
      if (err.response) {
        console.error('Error Response Data:', err.response.data);
        console.error('Error Response Headers:', err.response.headers);
      }
      if (err.request) {
        console.error('Error Request Data:', err.request);
      }
      console.error('Full Axios Error Object:', err.toJSON ? err.toJSON() : err);

      // Manejar específicamente los errores de autenticación
      if (status === 401) {
        console.error('Error de autenticación. Redirigiendo al login...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Solo redirigir si no estamos ya en la página de login
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login?expired=true';
        }
        
        throw new Error('Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.');
      }
      
      console.error(`Request failed: ${method} ${url}, Status: ${status}, Message: ${errorMessage}`);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const createBot = useCallback(async (plubotData) => {
    return await request('POST', '/api/plubots/create', plubotData);
  }, [request]);

  return { loading, error, request, createBot };
};

export default useAPI;
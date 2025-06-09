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
          window.location.href = '/login?expired=true';
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
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
        
        throw new Error('Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.');
      }
      
      console.error(`Request failed: ${method} ${url}, Status: ${status}, Message: ${errorMessage}`);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Función para crear un plubot con persistencia robusta
  const createBot = useCallback(async (plubotData) => {
    try {
      // Guardar una copia local del plubot antes de enviarlo al servidor
      const timestamp = new Date().toISOString();
      const plubotBackup = {
        ...plubotData,
        _localId: `local_${Date.now()}`,
        _timestamp: timestamp,
        _synced: false
      };
      
      // Guardar en localStorage como respaldo
      try {
        // Obtener plubots guardados localmente o inicializar array
        const localPlubots = JSON.parse(localStorage.getItem('local_plubots_backup') || '[]');
        
        // Añadir el nuevo plubot
        localPlubots.push(plubotBackup);
        
        // Guardar array actualizado
        localStorage.setItem('local_plubots_backup', JSON.stringify(localPlubots));
        console.log('[API] Respaldo local de plubot creado:', plubotBackup);
      } catch (backupError) {
        console.error('[API] Error al crear respaldo local del plubot:', backupError);
      }
      
      // Intentar enviar al servidor con sistema de reintentos
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          response = await request('POST', '/plubots/create', plubotData);
          
          // Si la petición es exitosa, actualizar el estado de sincronización
          if (response && response.status === 'success') {
            try {
              // Actualizar el estado del plubot en el respaldo local
              const localPlubots = JSON.parse(localStorage.getItem('local_plubots_backup') || '[]');
              const updatedLocalPlubots = localPlubots.map(p => {
                if (p._localId === plubotBackup._localId) {
                  return { ...p, id: response.plubot.id, _synced: true };
                }
                return p;
              });
              
              localStorage.setItem('local_plubots_backup', JSON.stringify(updatedLocalPlubots));
              console.log('[API] Plubot sincronizado correctamente con el servidor:', response.plubot);
              
              // Actualizar también el respaldo de plubots del usuario
              try {
                const userPlubots = JSON.parse(localStorage.getItem('user_plubots_backup') || '[]');
                // Añadir el nuevo plubot si no existe ya
                if (!userPlubots.some(p => p.id === response.plubot.id)) {
                  userPlubots.push(response.plubot);
                  localStorage.setItem('user_plubots_backup', JSON.stringify(userPlubots));
                  console.log('[API] Respaldo de plubots de usuario actualizado');
                }
              } catch (userBackupError) {
                console.error('[API] Error al actualizar respaldo de plubots del usuario:', userBackupError);
              }
            } catch (syncError) {
              console.error('[API] Error al actualizar estado de sincronización:', syncError);
            }
            
            break; // Salir del bucle de reintentos
          }
          
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            console.error(`[API] Error al crear plubot después de ${maxRetries} intentos:`, error);
            
            // Devolver un objeto de éxito simulado con los datos locales
            // para que la UI pueda continuar funcionando
            return {
              status: 'success',
              message: 'Plubot creado localmente. Se sincronizará cuando haya conexión.',
              plubot: {
                ...plubotBackup,
                id: plubotBackup._localId // Usar el ID local como ID temporal
              },
              _offlineMode: true
            };
          }
          
          console.warn(`[API] Reintentando crear plubot (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Espera progresiva
        }
      }
      
      return response;
    } catch (error) {
      console.error('[API] Error crítico al crear plubot:', error);
      
      // En caso de error crítico, devolver un objeto de error pero con los datos locales
      // para que la UI pueda mostrar un mensaje adecuado
      return {
        status: 'error',
        message: 'Error al crear plubot. Se ha guardado una copia local.',
        _localBackup: plubotData,
        _recoverable: true
      };
    }
  }, [request]);

  return { loading, error, request, createBot };
};

export default useAPI;
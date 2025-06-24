import { useState, useCallback } from 'react';

import instance from '../utils/axiosConfig';

const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      // La configuración de cabeceras y el token ahora se maneja
      // automáticamente en el interceptor de `axiosConfig.js`.
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(config.headers || {}),
      };

      // Para depuración


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


      if (err.response) {


      }
      if (err.request) {

      }


      // El manejo de errores 401 ahora es global y está en `axiosConfig.js`.
      // El interceptor se encargará del logout y la redirección.


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
        _synced: false,
      };

      // Guardar en localStorage como respaldo
      try {
        // Obtener plubots guardados localmente o inicializar array
        const localPlubots = JSON.parse(localStorage.getItem('local_plubots_backup') || '[]');

        // Añadir el nuevo plubot
        localPlubots.push(plubotBackup);

        // Guardar array actualizado
        localStorage.setItem('local_plubots_backup', JSON.stringify(localPlubots));

      } catch (backupError) {

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


              // Actualizar también el respaldo de plubots del usuario
              try {
                const userPlubots = JSON.parse(localStorage.getItem('user_plubots_backup') || '[]');
                // Añadir el nuevo plubot si no existe ya
                if (!userPlubots.some(p => p.id === response.plubot.id)) {
                  userPlubots.push(response.plubot);
                  localStorage.setItem('user_plubots_backup', JSON.stringify(userPlubots));

                }
              } catch (userBackupError) {

              }
            } catch (syncError) {

            }

            break; // Salir del bucle de reintentos
          }

        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {


            // Devolver un objeto de éxito simulado con los datos locales
            // para que la UI pueda continuar funcionando
            return {
              status: 'success',
              message: 'Plubot creado localmente. Se sincronizará cuando haya conexión.',
              plubot: {
                ...plubotBackup,
                id: plubotBackup._localId, // Usar el ID local como ID temporal
              },
              _offlineMode: true,
            };
          }


          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Espera progresiva
        }
      }

      return response;
    } catch (error) {


      // En caso de error crítico, devolver un objeto de error pero con los datos locales
      // para que la UI pueda mostrar un mensaje adecuado
      return {
        status: 'error',
        message: 'Error al crear plubot. Se ha guardado una copia local.',
        _localBackup: plubotData,
        _recoverable: true,
      };
    }
  }, [request]);

  return { loading, error, request, createBot };
};

export default useAPI;
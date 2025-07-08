import { useState, useCallback } from 'react';

import instance from '../utils/axios-config';

const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const request = useCallback(async (method, url, data, config = {}) => {
    setLoading(true);
    setError(undefined);
    try {
      // La configuración de cabeceras y el token ahora se maneja
      // automáticamente en el interceptor de `axios-config.js`.
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...config.headers,
      };

      const response = await instance({
        method,
        url,
        data: data ? JSON.stringify(data) : undefined,
        ...config,
        headers,
      });
      setLoading(false);
      return response.data;
    } catch (requestError) {
      setLoading(false);

      const errorMessage =
        requestError.response?.data?.message ||
        requestError.message ||
        'Error en la solicitud';

      // Las sentencias if vacías, posiblemente para depuración, han sido eliminadas.

      // El manejo de errores 401 ahora es global y está en `axios-config.js`.
      // El interceptor se encargará del logout y la redirección.

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Función para crear un plubot con persistencia robusta
  const createBot = useCallback(
    async (plubotData) => {
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
          const localPlubots = JSON.parse(
            localStorage.getItem('local_plubots_backup') || '[]',
          );

          // Añadir el nuevo plubot
          localPlubots.push(plubotBackup);

          // Guardar array actualizado
          localStorage.setItem(
            'local_plubots_backup',
            JSON.stringify(localPlubots),
          );
        } catch {
          /* Silenciado intencionalmente. */
        }

        // Intentar enviar al servidor con sistema de reintentos
        let response;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            // El 'await' es intencional dentro del bucle para el sistema de reintentos.
            // eslint-disable-next-line no-await-in-loop
            response = await request('POST', '/plubots/create', plubotData);

            // Si la petición es exitosa, actualizar el estado de sincronización
            if (response && response.status === 'success') {
              try {
                // Actualizar el estado del plubot en el respaldo local
                const localPlubots = JSON.parse(
                  localStorage.getItem('local_plubots_backup') || '[]',
                );
                const plubotId = response.plubot.id; // Extraído para corregir el error no-loop-func.
                const updatedLocalPlubots = localPlubots.map((p) => {
                  if (p._localId === plubotBackup._localId) {
                    return { ...p, id: plubotId, _synced: true };
                  }
                  return p;
                });

                localStorage.setItem(
                  'local_plubots_backup',
                  JSON.stringify(updatedLocalPlubots),
                );

                // Actualizar el respaldo de plubots del usuario.
                try {
                  const userBots = JSON.parse(
                    localStorage.getItem('user_plubots_backup') || '[]',
                  );
                  if (!userBots.some((p) => p.id === plubotId)) {
                    userBots.push(response.plubot);
                    localStorage.setItem(
                      'user_plubots_backup',
                      JSON.stringify(userBots),
                    );
                  }
                } catch {
                  /* Silenciado intencionalmente. */
                }
              } catch {
                /* Silenciado intencionalmente. */
              }

              break;
            }
          } catch {
            retryCount++;
            if (retryCount >= maxRetries) {
              // Devolver un objeto de éxito simulado con los datos locales
              // para que la UI pueda continuar funcionando
              return {
                status: 'success',
                message: 'Plubot creado localmente. Se sincronizará más tarde.',
                plubot: {
                  ...plubotBackup,
                  id: plubotBackup._localId, // Usar el ID local como ID temporal
                },
                _offlineMode: true,
              };
            }

            // El 'await' es intencional para la espera progresiva en los reintentos.
            const delay = 1000 * retryCount;
            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => {
              setTimeout(resolve, delay);
            });
          }
        }

        return response;
      } catch {
        // En caso de error crítico, devolver un objeto de error pero con los datos locales
        // para que la UI pueda mostrar un mensaje adecuado
        return {
          status: 'error',
          message: 'Error al crear plubot. Se guardó una copia local.',
          _localBackup: plubotData,
          _recoverable: true,
        };
      }
    },
    [request],
  );

  return { loading, error, request, createBot };
};

export default useAPI;

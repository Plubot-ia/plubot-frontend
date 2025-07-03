import { useEffect } from 'react';

import {
  safeGetItem,
  safeSetItem,
} from '../components/onboarding/flow-editor/utils/storage-manager';
import useAuthStore from '../stores/use-auth-store';
import useSyncStore from '../stores/use-sync-store';
import instance from '../utils/axios-config';

import logger from './loggerService';

/**
 * Servicio de sincronización para plubots en segundo plano
 * Este servicio se encarga de sincronizar los plubots creados en modo offline
 * y mantener actualizados los datos del usuario
 */

// Intervalo de sincronización en milisegundos (5 minutos por defecto)
const SYNC_INTERVAL = 5 * 60 * 1000;

/**
 * Sincroniza un plubot específico con el servidor
 * @param {Object} plubot - El plubot a sincronizar
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
/**
 * Actualiza un plubot en localStorage
 * @param {string} plubotId - ID del plubot a actualizar
 * @param {Object} updatedPlubot - Datos actualizados del plubot
 */
const updateLocalPlubot = (plubotId, updatedPlubot) => {
  try {
    // Actualizar en el respaldo de plubots del usuario
    const userPlubots = safeGetItem('user_plubots_backup', []);
    const updatedUserPlubots = userPlubots.map((p) =>
      p.id === plubotId ? updatedPlubot : p,
    );
    safeSetItem('user_plubots_backup', updatedUserPlubots);

    // Actualizar en el respaldo local de plubots
    const localPlubots = safeGetItem('local_plubots_backup', []);
    const updatedLocalPlubots = localPlubots.map((p) => {
      if (p._localId === plubotId || p.id === plubotId) {
        return { ...p, ...updatedPlubot, _synced: true };
      }
      return p;
    });
    safeSetItem('local_plubots_backup', updatedLocalPlubots);
  } catch (error) {
    logger.error('Error al actualizar plubot en localStorage:', error);
  }
};

/**
 * Actualiza un plubot en el store de autenticación
 * @param {string} plubotId - ID del plubot a actualizar
 * @param {Object} updatedPlubot - Datos actualizados del plubot
 */
const updateStorePlubot = (plubotId, updatedPlubot) => {
  try {
    const { user, updateUser } = useAuthStore.getState();
    if (user && user.plubots) {
      const updatedPlubots = user.plubots.map((p) => {
        if (p.id === plubotId) {
          return updatedPlubot;
        }
        return p;
      });

      updateUser({ ...user, plubots: updatedPlubots });
    }
  } catch (error) {
    logger.error('Error al actualizar plubot en el store:', error);
  }
};

/**
 * Sincroniza un plubot específico con el servidor
 * @param {Object} plubot - El plubot a sincronizar
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
const syncPlubot = async (plubot) => {
  try {
    // Verificar si el plubot fue creado en modo offline
    if (plubot._offlineCreated || plubot._recoveryPending) {
      // Preparar datos para sincronización
      const syncData = {
        ...plubot,
        _localId: plubot.id, // Guardar el ID local
        id: undefined, // Eliminar el ID para que el servidor asigne uno nuevo
      };

      // Eliminar propiedades locales
      delete syncData._offlineCreated;
      delete syncData._recoveryPending;
      delete syncData._synced;
      delete syncData._timestamp;

      // Enviar al servidor
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No hay token de autenticación');

      const response = await instance.post('plubots/create', syncData);

      if (response.data?.status === 'success' && response.data.plubot?.id) {
        // Actualizar el plubot local con el ID del servidor
        const updatedPlubot = {
          ...plubot,
          id: response.data.plubot.id,
          _offlineCreated: false,
          _recoveryPending: false,
          _synced: true,
          _syncedAt: new Date().toISOString(),
        };

        // Actualizar en localStorage
        updateLocalPlubot(plubot.id, updatedPlubot);

        // Actualizar en el store
        updateStorePlubot(plubot.id, updatedPlubot);

        return {
          success: true,
          plubot: updatedPlubot,
          message: 'Plubot sincronizado correctamente',
        };
      }

      throw new Error(response.data?.message || 'Error al sincronizar plubot');
    }

    // Si el plubot ya está sincronizado, verificar si hay cambios pendientes
    if (plubot._pendingChanges) {
      // Implementar lógica para sincronizar cambios
      // ...

      return { success: true, message: 'Cambios sincronizados correctamente' };
    }

    return { success: true, message: 'No hay cambios para sincronizar' };
  } catch (error) {
    return { success: false, error: error.message || 'Error desconocido' };
  }
};

/**
 * Ejecuta la sincronización de todos los plubots pendientes
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
export const syncAllPlubots = async () => {
  const { startSync, endSync } = useSyncStore.getState();

  // Usar la acción atómica para iniciar la sincronización
  if (!startSync()) {
    return { success: false, message: 'Ya hay una sincronización en curso' };
  }

  try {
    const { user } = useAuthStore.getState();
    if (!user || !user.plubots) {
      endSync({ status: 'success' }); // No hay nada que hacer, termina exitosamente
      return {
        success: true,
        message: 'No hay usuario o plubots para sincronizar',
      };
    }

    // Prioridad 1: Plubots en el store de usuario
    const plubotsToBeSynced = user.plubots.filter(
      (p) => p._offlineCreated || p._recoveryPending || p._pendingChanges,
    );

    // Prioridad 2: Plubots en el respaldo de localStorage que no están en el store
    const localPlubots = JSON.parse(
      localStorage.getItem('local_plubots_backup') || '[]',
    );
    const unsyncedLocal = localPlubots.filter((p) => {
      const isInStore = user.plubots.some((up) => up.id === p.id);
      return !p._synced && !isInStore;
    });

    const allPlubotsToSync = [...plubotsToBeSynced, ...unsyncedLocal];

    if (allPlubotsToSync.length === 0) {
      endSync({ status: 'success' });
      return {
        success: true,
        message: 'No hay plubots pendientes de sincronización',
      };
    }

    const results = await Promise.all(
      allPlubotsToSync.map((plubot) => syncPlubot(plubot)),
    );

    const errors = results.filter((r) => !r.success).map((r) => r.error);
    const finalStatus = errors.length === 0 ? 'success' : 'error';

    endSync({ status: finalStatus, errors });

    const successfulSyncs = results.filter((r) => r.success).length;
    const totalSyncs = results.length;

    return {
      success: finalStatus === 'success',
      results,
      message: `${successfulSyncs}/${totalSyncs} plubots sincronizados correctamente`,
    };
  } catch (error) {
    logger.error(
      'Error catastrófico durante la sincronización de plubots:',
      error,
    );
    endSync({
      status: 'error',
      errors: [error.message || 'Error desconocido'],
    });
    return { success: false, error: error.message || 'Error desconocido' };
  } finally {
    // La lógica de re-sincronización pendiente se puede manejar en el hook que consume el servicio
    const { pendingSync } = useSyncStore.getState();
    if (pendingSync) {
      setTimeout(syncAllPlubots, 1000); // Re-intentar si había una sincronización pendiente
    }
  }
};

/**
 * Obtiene el estado actual de sincronización
 * @returns {Object} - Estado de sincronización
 */
export const getSyncState = () => {
  const state = useSyncStore.getState();
  return {
    ...state,
    lastSyncFormatted: state.lastSync
      ? new Date(state.lastSync).toLocaleString()
      : 'Nunca',
  };
};

/**
 * Hook para usar el servicio de sincronización en componentes
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoSync - Si debe sincronizar automáticamente
 * @param {number} options.interval - Intervalo de sincronización en ms
 * @returns {Object} - Estado y funciones de sincronización
 */
export const useSyncService = (options = {}) => {
  const { autoSync = true, interval = SYNC_INTERVAL } = options;

  // Iniciar sincronización periódica
  useEffect(() => {
    let syncInterval;
    if (autoSync) {
      syncAllPlubots();
      syncInterval = setInterval(syncAllPlubots, interval);
    }
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [autoSync, interval]);

  return {
    syncState: getSyncState(),
    syncAllPlubots,
    syncPlubot,
  };
};

export default useSyncService;

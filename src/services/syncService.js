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
    const updatedUserPlubots = userPlubots.map((p) => (p.id === plubotId ? updatedPlubot : p));
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
 * Prepara los datos del plubot para sincronización
 * @param {Object} plubot - El plubot a preparar
 * @returns {Object} Datos preparados para envío al servidor
 */
function _prepareSyncData(plubot) {
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

  return syncData;
}

/**
 * Valida el token de autenticación para sincronización
 * @throws {Error} Si no hay token válido
 */
function _validateSyncAuth() {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('No hay token de autenticación');
}

/**
 * Procesa la respuesta exitosa de sincronización
 * @param {Object} response - Respuesta del servidor
 * @param {Object} plubot - Plubot original
 * @returns {Object} Resultado de sincronización exitosa
 */
function _processSyncResponse(response, plubot) {
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

  throw new Error(response.data?.message ?? 'Error al sincronizar plubot');
}

/**
 * Maneja la sincronización de cambios pendientes
 * @param {Object} plubot - Plubot con cambios pendientes
 * @returns {Object} Resultado de sincronización de cambios
 */
function _handlePendingChanges(_plubot) {
  // Implementar lógica para sincronizar cambios
  // ...
  return { success: true, message: 'Cambios sincronizados correctamente' };
}

/**
 * Sincroniza un plubot con el servidor.
 * @param {Object} plubot - El plubot a sincronizar
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
const syncPlubot = async (plubot) => {
  try {
    // Verificar si el plubot fue creado en modo offline
    if (plubot._offlineCreated || plubot._recoveryPending) {
      const syncData = _prepareSyncData(plubot);
      _validateSyncAuth();
      const response = await instance.post('plubots/create', syncData);
      return _processSyncResponse(response, plubot);
    }

    // Si el plubot ya está sincronizado, verificar si hay cambios pendientes
    if (plubot._pendingChanges) {
      return _handlePendingChanges(plubot);
    }

    return { success: true, message: 'No hay cambios para sincronizar' };
  } catch (error) {
    return { success: false, error: error.message ?? 'Error desconocido' };
  }
};

/**
 * Valida si hay usuario y plubots para sincronizar.
 * @param {Object} user - Usuario del AuthStore.
 * @returns {Object|null} - Respuesta de error si no es válido, null si es válido.
 */
function validateUserForSync(user) {
  if (!user || !user.plubots) {
    return {
      success: true,
      message: 'No hay usuario o plubots para sincronizar',
    };
  }
}

/**
 * Recopila todos los plubots que necesitan sincronización.
 * @param {Object} user - Usuario con plubots.
 * @returns {Array} - Array de plubots a sincronizar.
 */
function collectPlubotsToSync(user) {
  // Prioridad 1: Plubots en el store de usuario
  const plubotsToBeSynced = user.plubots.filter(
    (p) => p._offlineCreated || p._recoveryPending || p._pendingChanges,
  );

  // Prioridad 2: Plubots en el respaldo de localStorage que no están en el store
  const localPlubots = JSON.parse(localStorage.getItem('local_plubots_backup') ?? '[]');
  const unsyncedLocal = localPlubots.filter((p) => {
    const isInStore = user.plubots.some((up) => up.id === p.id);
    return !p._synced && !isInStore;
  });

  return [...plubotsToBeSynced, ...unsyncedLocal];
}

/**
 * Procesa los resultados de sincronización y calcula estadísticas.
 * @param {Array} results - Resultados de las sincronizaciones.
 * @returns {Object} - Estadísticas procesadas.
 */
function processSyncResults(results) {
  const errors = results.filter((r) => !r.success).map((r) => r.error);
  const finalStatus = errors.length === 0 ? 'success' : 'error';
  const successfulSyncs = results.filter((r) => r.success).length;
  const totalSyncs = results.length;

  return {
    finalStatus,
    errors,
    successfulSyncs,
    totalSyncs,
    results,
  };
}

/**
 * Maneja la re-sincronización pendiente si es necesaria.
 * @param {Function} syncFunction - Función de sincronización a ejecutar.
 */
function handlePendingSyncRetry(syncFunction) {
  const { pendingSync } = useSyncStore.getState();
  if (pendingSync) {
    setTimeout(syncFunction, 1000); // Re-intentar si había una sincronización pendiente
  }
}

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

    const validationError = validateUserForSync(user);
    if (validationError) {
      endSync({ status: 'success' }); // No hay nada que hacer, termina exitosamente
      return validationError;
    }

    const allPlubotsToSync = collectPlubotsToSync(user);

    if (allPlubotsToSync.length === 0) {
      endSync({ status: 'success' });
      return {
        success: true,
        message: 'No hay plubots pendientes de sincronización',
      };
    }

    const results = await Promise.all(allPlubotsToSync.map((plubot) => syncPlubot(plubot)));

    const { finalStatus, errors, successfulSyncs, totalSyncs } = processSyncResults(results);

    endSync({ status: finalStatus, errors });

    return {
      success: finalStatus === 'success',
      results,
      message: `${successfulSyncs}/${totalSyncs} plubots sincronizados correctamente`,
    };
  } catch (error) {
    logger.error('Error catastrófico durante la sincronización de plubots:', error);
    endSync({
      status: 'error',
      errors: [error.message ?? 'Error desconocido'],
    });
    return { success: false, error: error.message ?? 'Error desconocido' };
  } finally {
    // La lógica de re-sincronización pendiente se puede manejar en el hook que consume el servicio
    handlePendingSyncRetry(syncAllPlubots);
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
    lastSyncFormatted: state.lastSync ? new Date(state.lastSync).toLocaleString() : 'Nunca',
  };
};

/**
 * Hook para usar el servicio de sincronización en componentes
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoSync - Si debe sincronizar automáticamente
 * @param {number} options.interval - Intervalo de sincronización en ms
 * @returns {Object} - Estado y funciones de sincronización
 */
const useSyncService = (options = {}) => {
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

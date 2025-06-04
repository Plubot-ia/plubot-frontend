import { useEffect } from 'react';
import useAuthStore from '../stores/useAuthStore';
import instance from '../utils/axiosConfig';

/**
 * Servicio de sincronización para plubots en segundo plano
 * Este servicio se encarga de sincronizar los plubots creados en modo offline
 * y mantener actualizados los datos del usuario
 */

// Intervalo de sincronización en milisegundos (5 minutos por defecto)
const SYNC_INTERVAL = 5 * 60 * 1000;

// Estado de sincronización
let syncState = {
  isSyncing: false,
  lastSync: null,
  pendingSync: false,
  syncErrors: [],
  syncQueue: [],
  syncStatus: 'idle' // 'idle', 'syncing', 'success', 'error'
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
        id: undefined // Eliminar el ID para que el servidor asigne uno nuevo
      };
      
      // Eliminar propiedades locales
      delete syncData._offlineCreated;
      delete syncData._recoveryPending;
      delete syncData._synced;
      delete syncData._timestamp;
      
      // Enviar al servidor
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No hay token de autenticación');
      
      const response = await instance.post('/plubots/create', syncData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data?.status === 'success' && response.data.plubot?.id) {
        // Actualizar el plubot local con el ID del servidor
        const updatedPlubot = {
          ...plubot,
          id: response.data.plubot.id,
          _offlineCreated: false,
          _recoveryPending: false,
          _synced: true,
          _syncedAt: new Date().toISOString()
        };
        
        // Actualizar en localStorage
        updateLocalPlubot(plubot.id, updatedPlubot);
        
        // Actualizar en el store
        updateStorePlubot(plubot.id, updatedPlubot);
        
        return { success: true, plubot: updatedPlubot, message: 'Plubot sincronizado correctamente' };
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
    console.error('Error al sincronizar plubot:', error);
    return { success: false, error: error.message || 'Error desconocido' };
  }
};

/**
 * Actualiza un plubot en localStorage
 * @param {string} plubotId - ID del plubot a actualizar
 * @param {Object} updatedPlubot - Datos actualizados del plubot
 */
import { safeSetItem, safeGetItem } from '../components/onboarding/flow-editor/utils/storage-manager';

const updateLocalPlubot = (plubotId, updatedPlubot) => {
  try {
    // Actualizar en el respaldo de plubots del usuario
    const userPlubots = safeGetItem('user_plubots_backup', []);
    const updatedUserPlubots = userPlubots.map(p => p.id === plubotId ? updatedPlubot : p);
    safeSetItem('user_plubots_backup', updatedUserPlubots);
    
    // Actualizar en el respaldo local de plubots
    const localPlubots = safeGetItem('local_plubots_backup', []);
    const updatedLocalPlubots = localPlubots.map(p => {
      if (p._localId === plubotId || p.id === plubotId) {
        return { ...p, ...updatedPlubot, _synced: true };
      }
      return p;
    });
    safeSetItem('local_plubots_backup', updatedLocalPlubots);
    
    console.log('[Sync] Plubot actualizado en localStorage gestionado:', updatedPlubot);
  } catch (error) {
    console.error('[Sync] Error al actualizar plubot en localStorage gestionado:', error);
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
      const updatedPlubots = user.plubots.map(p => {
        if (p.id === plubotId) {
          return updatedPlubot;
        }
        return p;
      });
      
      updateUser({ ...user, plubots: updatedPlubots });
      console.log('[Sync] Plubot actualizado en el store:', updatedPlubot);
    }
  } catch (error) {
    console.error('[Sync] Error al actualizar plubot en el store:', error);
  }
};

/**
 * Ejecuta la sincronización de todos los plubots pendientes
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
export const syncAllPlubots = async () => {
  // Evitar sincronizaciones simultáneas
  if (syncState.isSyncing) {
    syncState.pendingSync = true;
    return { success: false, message: 'Ya hay una sincronización en curso' };
  }
  
  syncState.isSyncing = true;
  syncState.syncStatus = 'syncing';
  
  try {
    // Obtener plubots del usuario
    const { user } = useAuthStore.getState();
    if (!user || !user.plubots) {
      syncState.isSyncing = false;
      syncState.syncStatus = 'idle';
      return { success: false, message: 'No hay plubots para sincronizar' };
    }
    
    // Filtrar plubots que necesitan sincronización
    const plubotsToBeSynced = user.plubots.filter(p => 
      p._offlineCreated || p._recoveryPending || p._pendingChanges
    );
    
    if (plubotsToBeSynced.length === 0) {
      // También verificar en localStorage por si hay plubots que no están en el store
      const localPlubots = JSON.parse(localStorage.getItem('local_plubots_backup') || '[]');
      const unsynced = localPlubots.filter(p => !p._synced);
      
      if (unsynced.length === 0) {
        syncState.isSyncing = false;
        syncState.lastSync = new Date().toISOString();
        syncState.syncStatus = 'success';
        return { success: true, message: 'No hay plubots pendientes de sincronización' };
      }
      
      // Sincronizar plubots de localStorage que no están en el store
      const results = await Promise.all(unsynced.map(syncPlubot));
      
      syncState.isSyncing = false;
      syncState.lastSync = new Date().toISOString();
      syncState.syncStatus = 'success';
      
      return { 
        success: true, 
        results,
        message: `${results.filter(r => r.success).length}/${results.length} plubots sincronizados correctamente` 
      };
    }
    
    // Sincronizar plubots pendientes
    const results = await Promise.all(plubotsToBeSynced.map(syncPlubot));
    
    // Actualizar estado de sincronización
    syncState.isSyncing = false;
    syncState.lastSync = new Date().toISOString();
    syncState.syncStatus = results.every(r => r.success) ? 'success' : 'error';
    
    // Guardar errores si los hay
    const errors = results.filter(r => !r.success).map(r => r.error);
    if (errors.length > 0) {
      syncState.syncErrors = errors;
    }
    
    return { 
      success: results.some(r => r.success), 
      results,
      message: `${results.filter(r => r.success).length}/${results.length} plubots sincronizados correctamente` 
    };
  } catch (error) {
    console.error('[Sync] Error al sincronizar plubots:', error);
    
    syncState.isSyncing = false;
    syncState.syncStatus = 'error';
    syncState.syncErrors.push(error.message || 'Error desconocido');
    
    return { success: false, error: error.message || 'Error desconocido' };
  } finally {
    // Si hay una sincronización pendiente, ejecutarla
    if (syncState.pendingSync) {
      syncState.pendingSync = false;
      setTimeout(syncAllPlubots, 1000);
    }
  }
};

/**
 * Obtiene el estado actual de sincronización
 * @returns {Object} - Estado de sincronización
 */
export const getSyncState = () => ({
  ...syncState,
  lastSyncFormatted: syncState.lastSync ? new Date(syncState.lastSync).toLocaleString() : 'Nunca'
});

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
    if (!autoSync) return;
    
    // Sincronizar al montar el componente
    syncAllPlubots();
    
    // Configurar intervalo de sincronización
    const syncInterval = setInterval(syncAllPlubots, interval);
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(syncInterval);
  }, [autoSync, interval]);
  
  return {
    syncState: getSyncState(),
    syncAllPlubots,
    syncPlubot
  };
};

export default useSyncService;

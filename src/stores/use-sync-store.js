import { create } from 'zustand';

/**
 * Store de Zustand para gestionar el estado del servicio de sincronización.
 * Proporciona actualizaciones atómicas para prevenir condiciones de carrera.
 */
const useSyncStore = create((set, get) => ({
  isSyncing: false,
  lastSync: undefined,
  pendingSync: false,
  syncErrors: [],
  syncStatus: 'idle', // 'idle', 'syncing', 'success', 'error'

  /**
   * Inicia un proceso de sincronización de forma atómica.
   * Si hay una sincronización en curso, la marca como pendiente.
   * @returns {boolean} - True si la sincronización comenzó, false si ya estaba en curso.
   */
  startSync: () => {
    if (get().isSyncing) {
      set({ pendingSync: true });
      return false; // No iniciar una nueva sincronización
    }
    set({
      isSyncing: true,
      syncStatus: 'syncing',
      pendingSync: false, // Resetea el pendiente porque esta sincronización se está ejecutando
      syncErrors: [], // Limpia errores de la ejecución anterior
    });
    return true; // Sincronización iniciada
  },

  /**
   * Finaliza un proceso de sincronización y actualiza el estado.
   * @param {{ status: 'success' | 'error', errors?: any[] }} payload - Resultado.
   */
  endSync: ({ status, errors = [] }) => {
    const updates = {
      isSyncing: false,
      lastSync: new Date().toISOString(),
      syncStatus: status,
    };

    if (errors.length > 0) {
      updates.syncErrors = [...get().syncErrors, ...errors];
    }

    set(updates);

    // Disparar evento global para notificaciones visuales
    const success = status === 'success';
    const message = success
      ? 'Sincronización completada con éxito'
      : `Error de sincronización: ${errors.join(', ')}`;

    globalThis.dispatchEvent(
      new CustomEvent('flow-saved', {
        detail: { success, message },
      }),
    );
  },

  /**
   * Resetea el estado de sincronización a sus valores iniciales.
   */
  resetSyncState: () => {
    set({
      isSyncing: false,
      lastSync: undefined,
      pendingSync: false,
      syncErrors: [],
      syncStatus: 'idle',
    });
  },
}));

export default useSyncStore;

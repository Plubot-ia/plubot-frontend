import { useCallback } from 'react';
import { safeSetItem, safeGetItem } from '../utils/storage-manager';

/**
 * Hook para gestionar la creación y recuperación de respaldos locales del flujo.
 */
const useLocalBackupManager = (plubotId) => {
  const createBackup = useCallback((nodes, edges) => {
    if (!plubotId || !nodes || !edges) return;

    try {
      const backupData = { nodes, edges, timestamp: Date.now() };
      safeSetItem(`plubot-backup-${plubotId}`, backupData);
      console.log(`[useLocalBackupManager] Backup created for plubotId: ${plubotId}`);
    } catch (e) {
      console.error('[useLocalBackupManager] Error al crear respaldo local:', e);
    }
  }, [plubotId]);

  const recoverFromBackup = useCallback(() => {
    if (!plubotId) return null;

    try {
      const backupData = safeGetItem(`plubot-backup-${plubotId}`);
      if (backupData) {
        console.log(`[useLocalBackupManager] Backup recovered for plubotId: ${plubotId}`);
      }
      return backupData;
    } catch (e) {
      console.error('[useLocalBackupManager] Error al recuperar respaldo:', e);
      return null;
    }
  }, [plubotId]);

  return {
    createBackup,
    recoverFromBackup,
  };
};

export default useLocalBackupManager;

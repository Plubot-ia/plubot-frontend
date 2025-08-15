import { useCallback } from 'react';

import { safeSetItem, safeGetItem } from '../utils/storage-manager';

/**
 * Hook para gestionar la creación y recuperación de respaldos locales del flujo.
 */
const useLocalBackupManager = (plubotId) => {
  const createBackup = useCallback(
    (nodes, edges) => {
      if (!plubotId || !nodes || !edges) return;

      try {
        const backupData = { nodes, edges, timestamp: Date.now() };
        safeSetItem(`plubot-backup-${plubotId}`, backupData);
      } catch {
        // Silently catch errors
      }
    },
    [plubotId],
  );

  const recoverFromBackup = useCallback(() => {
    if (!plubotId) return;

    try {
      const backupData = safeGetItem(`plubot-backup-${plubotId}`);
      return backupData;
    } catch {}
  }, [plubotId]);

  const hasLocalBackup = useCallback(() => {
    if (!plubotId) return false;

    try {
      const backupData = safeGetItem(`plubot-backup-${plubotId}`);
      return Boolean(backupData);
    } catch {
      return false;
    }
  }, [plubotId]);

  return {
    createBackup,
    recoverFromBackup,
    hasLocalBackup,
  };
};

export default useLocalBackupManager;

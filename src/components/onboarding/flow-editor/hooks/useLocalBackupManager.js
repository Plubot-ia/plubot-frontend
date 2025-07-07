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
      } catch {}
    },
    [plubotId],
  );

  const recoverFromBackup = useCallback(() => {
    if (!plubotId) return null;

    try {
      const backupData = safeGetItem(`plubot-backup-${plubotId}`);
      if (backupData) {
      }
      return backupData;
    } catch {
      return null;
    }
  }, [plubotId]);

  const hasLocalBackup = useCallback(() => {
    if (!plubotId) return false;

    try {
      const backupData = safeGetItem(`plubot-backup-${plubotId}`);
      return !!backupData;
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

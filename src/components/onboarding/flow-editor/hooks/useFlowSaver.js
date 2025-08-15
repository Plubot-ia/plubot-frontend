import { useCallback, useState } from 'react';

import useDebounce from '@/hooks/useDebounce';
import useFlowStore from '@/stores/use-flow-store';

import { prepareEdgesForSaving } from '../utils/edgeFixUtility';

import { useSaveStatus, useSaveHandlers } from './useFlowSaver.helpers';
import useLocalBackupManager from './useLocalBackupManager';

export const useFlowSaver = (plubotId, handleError, setHasChanges) => {
  const { nodes, edges, saveFlow, setNodes, setEdges, lastSaved, isLoaded } = useFlowStore(
    (state) => ({
      nodes: state.nodes,
      edges: state.edges,
      saveFlow: state.saveFlow,
      setNodes: state.setNodes,
      setEdges: state.setEdges,
      lastSaved: state.lastSaved,
      isLoaded: state.isLoaded,
    }),
  );

  const { createBackup, recoverFromBackup, hasLocalBackup } = useLocalBackupManager(plubotId);

  const [isBackupLoaded, setBackupLoaded] = useState(false);
  const { status, setStatus, message, setMessage, show, setShow } = useSaveStatus();

  const attemptBackupRecovery = useCallback(() => {
    if (isBackupLoaded) return;

    const backup = recoverFromBackup();
    if (backup && backup.nodes && backup.edges) {
      setNodes(backup.nodes);
      setEdges(backup.edges);
      setBackupLoaded(true);
    }
  }, [isBackupLoaded, recoverFromBackup, setNodes, setEdges]);

  const { handleSaveError, handleSaveSuccess } = useSaveHandlers({
    status,
    setStatus,
    setMessage,
    setShow,
    nodes,
    edges,
    createBackup,
    handleError,
    setHasChanges,
  });

  const saveFlowHandler = useCallback(async () => {
    if (!plubotId || status === 'saving') return;

    setStatus('saving');
    setMessage('Guardando cambios...');
    setShow(true);

    const preparedEdges = prepareEdgesForSaving(edges);

    try {
      const saveData = await saveFlow();
      if (saveData && saveData.success) {
        handleSaveSuccess();
      } else {
        handleSaveError(saveData, preparedEdges);
      }
    } catch (error) {
      handleSaveError(error, preparedEdges);
    }
  }, [
    plubotId,
    status,
    edges,
    saveFlow,
    handleSaveSuccess,
    handleSaveError,
    setStatus,
    setMessage,
    setShow,
  ]);

  const debouncedSave = useDebounce(saveFlowHandler, 1000);

  return {
    saveFlowHandler,
    debouncedSave, // <-- Exportar la función con debounce
    lastSaved,
    saveStatus: status,
    showSaveStatus: show,
    saveMessage: message,
    attemptBackupRecovery,
    isBackupLoaded,
    isLoaded,
    hasLocalBackup,
  };
};

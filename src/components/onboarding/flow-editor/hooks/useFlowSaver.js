import { useCallback, useState, useEffect } from 'react';

import useDebounce from '@/hooks/useDebounce';
import useFlowStore from '@/stores/use-flow-store';

import { prepareEdgesForSaving } from '../utils/edgeFixUtility';

import useLocalBackupManager from './useLocalBackupManager';

export const useFlowSaver = (plubotId, handleError, setHasChanges) => {
  const { nodes, edges, saveFlow, setNodes, setEdges, lastSaved, isLoaded } =
    useFlowStore((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      saveFlow: state.saveFlow,
      setNodes: state.setNodes,
      setEdges: state.setEdges,
      lastSaved: state.lastSaved,
      isLoaded: state.isLoaded,
    }));

  const { createBackup, recoverFromBackup, hasLocalBackup } =
    useLocalBackupManager(plubotId);

  const [status, setStatus] = useState('idle'); // idle, saving, success, error
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const [isBackupLoaded, setBackupLoaded] = useState(false);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const attemptBackupRecovery = useCallback(() => {
    if (isBackupLoaded) return;

    const backup = recoverFromBackup();
    if (backup && backup.nodes && backup.edges) {
      setNodes(backup.nodes);
      setEdges(backup.edges);
      setBackupLoaded(true);
    }
  }, [isBackupLoaded, recoverFromBackup, setNodes, setEdges]);

  const handleSaveError = useCallback(
    (error, preparedEdges) => {
      const errorMessage =
        (error instanceof Error ? error.message : error?.message) ||
        'Error desconocido al guardar';
      setStatus('error');
      setMessage(errorMessage);
      setShow(true);
      createBackup(nodes, preparedEdges || edges);
      if (error instanceof Error && handleError) {
        handleError(error);
      }
    },
    [nodes, edges, createBackup, handleError],
  );

  const handleSaveSuccess = useCallback(() => {
    if (setHasChanges) {
      setHasChanges(false);
    }
    setStatus('success');
    setMessage('Cambios guardados correctamente');
    setShow(true);
  }, [setHasChanges]);

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
  }, [plubotId, status, edges, saveFlow, handleSaveSuccess, handleSaveError]);

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

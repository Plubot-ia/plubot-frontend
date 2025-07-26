/**
 * @file useFlowEditorCallbacks.js
 * @description Custom hook para gestionar los callbacks y funciones en FlowEditor
 * Extraído de FlowEditor.jsx para reducir max-lines-per-function
 */

import { useCallback } from 'react';

import useFlowEditorEdgeCallbacks from './useFlowEditorEdgeCallbacks';
import useFlowEditorNodeCallbacks from './useFlowEditorNodeCallbacks';

/**
 * Custom hook para gestionar los callbacks de FlowEditor
 * @param {Object} params - Parámetros necesarios para los callbacks
 * @param {Function} params.saveHistoryState - Función para guardar estado de historial
 * @param {Function} params.onNodesChange - Callback de cambios en nodos
 * @param {Function} params.onEdgesChange - Callback de cambios en edges
 * @param {Function} params.setEdges - Setter para edges
 * @param {Function} params.setHasChanges - Setter para indicar cambios
 * @param {Function} params.setNodes - Setter para nodos
 * @param {Function} params.recoverFromBackup - Función para recuperar respaldo
 * @param {Function} params.prepareEdgesForSaving - Función para preparar edges
 * @param {Function} params.setBackupExists - Setter para existencia de respaldo
 * @param {Function} params.setRecoveryOpen - Setter para diálogo de recuperación
 * @returns {Object} Callbacks optimizados para FlowEditor
 */
export const useFlowEditorCallbacks = ({
  saveHistoryState,
  onNodesChange,
  onEdgesChange,
  setEdges,
  setHasChanges,
  setNodes,
  recoverFromBackup,
  prepareEdgesForSaving,
  setBackupExists,
  setRecoveryOpen,
}) => {
  // Hooks para callbacks de nodos y edges
  const nodeCallbacks = useFlowEditorNodeCallbacks({
    saveHistoryState,
    onNodesChange,
    setHasChanges,
  });

  const edgeCallbacks = useFlowEditorEdgeCallbacks({
    saveHistoryState,
    onEdgesChange,
    setEdges,
    setHasChanges,
  });

  // Handler para recuperación de respaldo
  const handleRecover = useCallback(() => {
    const backup = recoverFromBackup();
    if (backup && backup.nodes && backup.edges) {
      setNodes(backup.nodes);
      setEdges(prepareEdgesForSaving(backup.edges));
    }
    setBackupExists(false);
    setRecoveryOpen(false);
  }, [
    recoverFromBackup,
    setNodes,
    setEdges,
    prepareEdgesForSaving,
    setBackupExists,
    setRecoveryOpen,
  ]);

  // Handler para descartar respaldo
  const handleDiscard = useCallback(() => {
    setBackupExists(false);
    setRecoveryOpen(false);
  }, [setBackupExists, setRecoveryOpen]);

  return {
    // Callbacks de nodos
    ...nodeCallbacks,

    // Callbacks de edges
    ...edgeCallbacks,

    // Handlers de recuperación
    handleRecover,
    handleDiscard,
  };
};

export default useFlowEditorCallbacks;

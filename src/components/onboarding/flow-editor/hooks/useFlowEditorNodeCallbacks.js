/**
 * @file useFlowEditorNodeCallbacks.js
 * @description Custom hook para gestionar callbacks de nodos en FlowEditor
 * Extraído de useFlowEditorCallbacks.js para reducir max-lines-per-function
 */

import { useCallback } from 'react';

/**
 * Custom hook para gestionar callbacks relacionados con nodos
 * @param {Object} params - Parámetros necesarios para los callbacks
 * @param {Function} params.saveHistoryState - Función para guardar estado de historial
 * @param {Function} params.onNodesChange - Callback de cambios en nodos
 * @param {Function} params.setHasChanges - Setter para indicar cambios
 * @returns {Object} Callbacks optimizados para nodos
 */
const useFlowEditorNodeCallbacks = ({ saveHistoryState, onNodesChange, setHasChanges }) => {
  // Callback optimizado para cambios en nodos
  const onNodesChangeOptimized = useCallback(
    (changes) => {
      onNodesChange(changes);
      setHasChanges(true);
    },
    [onNodesChange, setHasChanges],
  );

  // Callback para finalización de arrastre de selección
  const onSelectionDragStop = useCallback(() => {
    saveHistoryState();
    setHasChanges(true);
  }, [saveHistoryState, setHasChanges]);

  return {
    onNodesChangeOptimized,
    onSelectionDragStop,
  };
};

export default useFlowEditorNodeCallbacks;

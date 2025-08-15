/**
 * @file useFlowEditorEdgeCallbacks.js
 * @description Custom hook para gestionar callbacks de edges en FlowEditor
 * Extraído de useFlowEditorCallbacks.js para reducir max-lines-per-function
 */

import { useCallback, useState } from 'react';

/**
 * Custom hook para gestionar callbacks relacionados con edges
 * @param {Object} params - Parámetros necesarios para los callbacks
 * @param {Function} params.saveHistoryState - Función para guardar estado de historial
 * @param {Function} params.onEdgesChange - Callback de cambios en edges
 * @param {Function} params.setEdges - Setter para edges
 * @param {Function} params.setHasChanges - Setter para indicar cambios
 * @returns {Object} Callbacks optimizados para edges
 */
const useFlowEditorEdgeCallbacks = ({
  saveHistoryState,
  onEdgesChange,
  setEdges,
  setHasChanges,
}) => {
  // Estado para seguimiento de actualización de edges
  const [edgeUpdateSuccessful, setEdgeUpdateSuccessful] = useState(false);

  // Callback optimizado para cambios en edges
  const onEdgesChangeOptimized = useCallback(
    (changes) => {
      onEdgesChange(changes);
      setHasChanges(true);
    },
    [onEdgesChange, setHasChanges],
  );

  // Callback para actualización de edges
  const onEdgeUpdate = useCallback(
    (oldEdge, newConnection) => {
      saveHistoryState();

      setEdges((currentEdges) => {
        const filtered = currentEdges.filter((edge) => edge.id !== oldEdge.id);
        const newEdge = {
          ...newConnection,
          id: `e-${newConnection.source}-${newConnection.target}-${Date.now()}`,
          type: oldEdge.type || 'elite-edge',
          animated: oldEdge.animated ?? false,
          data: oldEdge.data || { text: '' },
        };
        return [...filtered, newEdge];
      });

      setHasChanges(true);
    },
    [setEdges, saveHistoryState, setHasChanges],
  );

  // Callback para inicio de actualización de edge
  const onEdgeUpdateStart = useCallback(() => {
    setEdgeUpdateSuccessful(false);
  }, []);

  // Callback para final de actualización de edge
  const onEdgeUpdateEnd = useCallback(
    (_event, edge) => {
      if (!edgeUpdateSuccessful) {
        setEdges((currentEdges) =>
          currentEdges.filter((currentEdge) => currentEdge.id !== edge.id),
        );
      }
    },
    [edgeUpdateSuccessful, setEdges],
  );

  return {
    // Callbacks de edges
    onEdgesChangeOptimized,
    onEdgeUpdate,
    onEdgeUpdateStart,
    onEdgeUpdateEnd,

    // Estado relacionado
    edgeUpdateSuccessful,
    setEdgeUpdateSuccessful,
  };
};

export default useFlowEditorEdgeCallbacks;

import { useCallback, useState } from 'react';

import { prepareEdgesForSaving } from '../utils/edgeFixUtility';

/**
 * Custom hook para manejar todos los handlers de eventos del FlowEditor
 * Extrae handlers específicos para reducir complejidad del componente principal
 */
const useFlowEditorHandlers = ({
  onNodesChange,
  onEdgesChange,
  setHasChanges,
  saveHistoryState,
  setEdges,
  recoverFromBackup,
  setNodes,
  setRecoveryOpen,
}) => {
  // Estado para edge update
  const [edgeUpdateSuccessful, setEdgeUpdateSuccessful] = useState(false);

  // Handlers optimizados para nodes y edges
  const onNodesChangeOptimized = useCallback(
    (changes) => {
      onNodesChange(changes);
      setHasChanges(true);
    },
    [onNodesChange, setHasChanges],
  );

  const onEdgesChangeOptimized = useCallback(
    (changes) => {
      onEdgesChange(changes);
      setHasChanges(true);
    },
    [onEdgesChange, setHasChanges],
  );

  // Handler para drag selection
  const onSelectionDragStop = useCallback(() => {
    saveHistoryState();
    setHasChanges(true);
  }, [saveHistoryState, setHasChanges]);

  // Handlers para edge updates
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

  const onEdgeUpdateStart = useCallback(() => setEdgeUpdateSuccessful(false), []);

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

  // Handlers para recovery dialog
  const handleRecover = useCallback(() => {
    const backup = recoverFromBackup();
    if (backup && backup.nodes && backup.edges) {
      setNodes(backup.nodes);
      setEdges(prepareEdgesForSaving(backup.edges));
    }
    setRecoveryOpen(false);
  }, [recoverFromBackup, setNodes, setEdges, setRecoveryOpen]);

  const handleDismiss = useCallback(() => setRecoveryOpen(false), [setRecoveryOpen]);

  return {
    edgeUpdateSuccessful,
    setEdgeUpdateSuccessful,
    onNodesChangeOptimized,
    onEdgesChangeOptimized,
    onSelectionDragStop,
    onEdgeUpdate,
    onEdgeUpdateStart,
    onEdgeUpdateEnd,
    handleRecover,
    handleDismiss,
  };
};

export default useFlowEditorHandlers;

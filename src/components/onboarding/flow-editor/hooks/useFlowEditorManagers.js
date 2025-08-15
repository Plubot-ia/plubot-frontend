import { useCallback } from 'react';

import useFlowStore from '@/stores/use-flow-store';

import useDragAndDropManager from './useDragAndDropManager';
import useFlowElementsManager from './useFlowElementsManager';

/**
 * Custom hook para manejar todos los managers restantes del FlowEditor
 * Extrae saveHistoryState, useFlowElementsManager y useDragAndDropManager
 */
const useFlowEditorManagers = ({
  addToHistory,
  setHasChanges,
  reactFlowWrapperReference,
  reactFlowInstance,
}) => {
  // Save history state callback
  const saveHistoryState = useCallback(() => {
    const flowState = {
      nodes: useFlowStore.getState().nodes,
      edges: useFlowStore.getState().edges,
    };
    addToHistory(flowState);
  }, [addToHistory]);

  // Flow elements manager
  const { onConnectNodes } = useFlowElementsManager(saveHistoryState, setHasChanges);

  // Drag and drop manager
  const { onDragOver, onDrop } = useDragAndDropManager(
    reactFlowWrapperReference,
    reactFlowInstance,
    setHasChanges,
  );

  return {
    saveHistoryState,
    onConnectNodes,
    onDragOver,
    onDrop,
  };
};

export default useFlowEditorManagers;

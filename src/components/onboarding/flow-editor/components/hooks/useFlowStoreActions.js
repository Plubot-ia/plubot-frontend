/**
 * useFlowStoreActions.js
 * Custom hook for managing FlowStore actions and selectors
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

import useFlowStore from '@/stores/use-flow-store';

/**
 * Custom hook for managing FlowStore actions and selectors
 * Provides memoized access to store actions and key setters
 *
 * @returns {Object} Object containing all flow store actions and setters
 */
export const useFlowStoreActions = () => {
  // OPTIMIZED: Select each action individually to prevent unnecessary re-renders
  // Actions are stable references, so we can use them directly
  const setReactFlowInstanceFromStore = useFlowStore((state) => state.setReactFlowInstance);
  const setNodes = useFlowStore((state) => state.setNodes);
  const setEdges = useFlowStore((state) => state.setEdges);
  const toggleUltraMode = useFlowStore((state) => state.toggleUltraMode);
  const undo = useFlowStore((state) => state.undo);
  const redo = useFlowStore((state) => state.redo);

  // OPTIMIZED: Select canUndo/canRedo values directly instead of functions
  // This prevents re-renders when other store properties change
  const canUndo = useFlowStore((state) => state.canUndo());
  const canRedo = useFlowStore((state) => state.canRedo());

  return {
    setReactFlowInstanceFromStore,
    setNodes,
    setEdges,
    toggleUltraMode,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};

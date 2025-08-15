/**
 * useFlowStoreSelectors.js
 * Custom hook for managing Zustand store selectors
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

import useFlowStore from '@/stores/use-flow-store';

/**
 * Custom hook for managing optimized Zustand store selectors
 * Centralizes store access with optimized selectors to minimize re-renders
 *
 * @returns {Object} Store state values
 */
export const useFlowStoreSelectors = () => {
  // OPTIMIZED: Use shallow comparison to prevent re-renders during panning
  // Only re-render if these specific values actually change
  const storeData = useFlowStore(
    (state) => ({
      zustandNodes: state.nodes ?? [],
      zustandEdges: state.edges ?? [],
      isUltraMode: state.isUltraMode,
      plubotId: state.plubotId,
      flowName: state.flowName,
    }),
    // Shallow equality check - prevents re-renders when other store properties change
    (a, b) => {
      return (
        a.zustandNodes === b.zustandNodes &&
        a.zustandEdges === b.zustandEdges &&
        a.isUltraMode === b.isUltraMode &&
        a.plubotId === b.plubotId &&
        a.flowName === b.flowName
      );
    },
  );

  return storeData;
};

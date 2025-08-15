/**
 * useFlowEffectsConfigConsolidated.js
 * Custom hook for managing FlowEffects configuration (consolidated)
 * Extracted from FlowMain for massive line reduction
 *
 * @version 1.0.0
 */

import { useFlowEffectsConfig } from './useFlowEffectsConfig';

/**
 * Custom hook for FlowEffects configuration (consolidated)
 * Centralizes all FlowEffects configuration preparation logic
 *
 * @param {Object} params - All required parameters for FlowEffects
 * @returns {Object} FlowEffects config
 */
export const useFlowEffectsConfigConsolidated = ({
  nodes,
  setNodes,
  areEdgesReady,
  setAreEdgesReady,
  isInitialLoad,
  fitView,
  incomingReactFlowInstance,
  reactFlowInstanceReference,
  startMonitoring,
  updatePerformance,
  reactFlowInstance,
  edges,
  setReactFlowInstanceFromStore,
  externalSetReactFlowInstance,
}) => {
  return useFlowEffectsConfig({
    nodes,
    setNodes,
    areEdgesReady,
    setAreEdgesReady,
    isInitialLoad,
    fitView,
    incomingReactFlowInstance,
    reactFlowInstanceReference,
    startMonitoring,
    updatePerformance,
    reactFlowInstance,
    edges,
    setReactFlowInstanceFromStore,
    externalSetReactFlowInstance,
  });
};

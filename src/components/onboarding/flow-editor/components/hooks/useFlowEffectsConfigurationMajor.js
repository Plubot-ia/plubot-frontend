/**
 * useFlowEffectsConfigurationMajor.js
 * Custom hook for managing Flow effects configuration (major consolidation)
 * Extracted from FlowMain for substantial line reduction
 *
 * @version 1.0.0
 */

import { useFlowEffectsConfigConsolidated } from './useFlowEffectsConfigConsolidated';

/**
 * Custom hook for Flow effects configuration (major consolidation)
 * Centralizes all flow effects configuration preparation logic
 *
 * @param {Object} params - All required parameters for flow effects
 * @returns {Object} Flow effects config
 */
export const useFlowEffectsConfigurationMajor = ({
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
  return useFlowEffectsConfigConsolidated({
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

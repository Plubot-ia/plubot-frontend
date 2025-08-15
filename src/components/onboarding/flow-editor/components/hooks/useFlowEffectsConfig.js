/**
 * useFlowEffectsConfig.js
 * Custom hook for managing flow effects configuration
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

import { useMemo } from 'react';

/**
 * Custom hook for managing flow effects configuration
 * Prepares and memoizes the configuration object for useFlowEffects
 *
 * @param {Array} nodes - Flow nodes array
 * @param {Function} setNodes - Function to update nodes
 * @param {boolean} areEdgesReady - Edge readiness state
 * @param {Function} setAreEdgesReady - Function to set edge readiness state
 * @param {boolean} isInitialLoad - Initial load state
 * @param {Function} fitView - ReactFlow fitView function
 * @param {Object} incomingReactFlowInstance - Incoming ReactFlow instance
 * @param {Object} reactFlowInstanceReference - ReactFlow instance reference
 * @param {Function} startMonitoring - Performance monitoring function
 * @param {Function} updatePerformance - Performance update function
 * @param {Object} reactFlowInstance - Current ReactFlow instance
 * @param {Array} edges - Flow edges array
 * @param {Function} setReactFlowInstanceFromStore - Store setter function
 * @param {Function} externalSetReactFlowInstance - External setter function
 * @returns {Object} Configuration object for useFlowEffects
 */
export const useFlowEffectsConfig = ({
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
  const flowEffectsConfig = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return flowEffectsConfig;
};

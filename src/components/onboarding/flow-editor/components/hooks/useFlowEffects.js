/**
 * useFlowEffects.js
 * Custom hook to manage all FlowMain effects
 * Reduces complexity by extracting effect logic
 */

import { useEffect, useCallback } from 'react';

import {
  ensureNodesAreInteractive,
  stopNodeInteractionObserver,
} from '../../utils/ensure-node-interaction';
import { fixNodePositions } from '../../utils/fix-node-positions';

/**
 * Custom hook for FlowMain effects
 */
export const useFlowEffects = ({
  nodes,
  setNodes,
  setAreEdgesReady,
  isInitialLoad,
  fitView,
  incomingReactFlowInstance,
  reactFlowInstanceReference,
  startMonitoring,
  updatePerformance,
  reactFlowInstance,
  edges,
}) => {
  // Helper functions for node update effects
  const _validateNodesForUpdate = useCallback(() => {
    if (!nodes || !Array.isArray(nodes)) return false;
    return nodes.length > 0 && !isInitialLoad.current;
  }, [nodes, isInitialLoad]);

  const _processNodeUpdates = useCallback(() => {
    try {
      const updatedNodes = fixNodePositions(nodes);
      if (updatedNodes && updatedNodes !== nodes && typeof setNodes === 'function') {
        setNodes(updatedNodes);
      }
    } catch {
      // Error handling without logging
    }
    ensureNodesAreInteractive();
  }, [nodes, setNodes]);

  const _handleInitialLoadState = useCallback(() => {
    if (isInitialLoad.current && nodes.length > 0) {
      isInitialLoad.current = false;
      setTimeout(() => ensureNodesAreInteractive(true), 300);
    }
  }, [nodes, isInitialLoad]);

  // Effect: Edge readiness delay (fixes race condition)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAreEdgesReady(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [setAreEdgesReady]);

  // Effect: Initial view fitting
  useEffect(() => {
    if (isInitialLoad.current && nodes.length > 0 && fitView) {
      fitView({ duration: 250, padding: 0.1 });
      isInitialLoad.current = false;
    }
  }, [nodes, fitView, isInitialLoad]);

  // Effect: ReactFlow instance synchronization
  useEffect(() => {
    if (incomingReactFlowInstance) {
      reactFlowInstanceReference.current = incomingReactFlowInstance;
    }
  }, [incomingReactFlowInstance, reactFlowInstanceReference]);

  // Effect: Performance monitoring
  useEffect(() => {
    const cleanup = startMonitoring(nodes, edges);

    if (reactFlowInstance) {
      const currentViewport = reactFlowInstance.getViewport();
      updatePerformance(currentViewport);
    }

    return cleanup;
  }, [nodes, edges, startMonitoring, updatePerformance, reactFlowInstance]);

  // Effect: Node position fixes and interaction
  useEffect(() => {
    if (_validateNodesForUpdate()) {
      _processNodeUpdates();
    }
    _handleInitialLoadState();
  }, [nodes, setNodes, _validateNodesForUpdate, _processNodeUpdates, _handleInitialLoadState]);

  // Effect: Cleanup on unmount
  useEffect(() => {
    return () => {
      stopNodeInteractionObserver();
    };
  }, []);

  // Effect: Simulator cleanup
  useEffect(() => {
    return () => {
      if (reactFlowInstanceReference.current) {
        reactFlowInstanceReference.current = undefined;
      }
    };
  }, [reactFlowInstanceReference]);

  // Effect: Flow fixes (commented out legacy code preserved)
  useEffect(() => {
    // Legacy optimized flow fixes code preserved but disabled
    // Can be re-enabled if needed
  }, []);

  return {
    // Return any values that might be needed by the main component
    // Currently all effects are self-contained
  };
};

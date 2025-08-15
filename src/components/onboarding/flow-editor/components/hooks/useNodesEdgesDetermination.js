/**
 * useNodesEdgesDetermination.js
 * Custom hook for determining which nodes and edges to use (external vs internal)
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

import { useMemo } from 'react';

/**
 * Custom hook for determining which nodes and edges to use
 * Handles the logic of choosing between external or internal nodes/edges
 * with proper memoization and edge readiness state
 *
 * @param {Array} externalNodes - External nodes array
 * @param {Array} zustandNodes - Internal Zustand nodes array
 * @param {Array} externalEdges - External edges array
 * @param {Array} zustandEdges - Internal Zustand edges array
 * @param {boolean} areEdgesReady - Edge readiness state
 * @returns {Object} Determined nodes and edges
 */
export const useNodesEdgesDetermination = ({
  externalNodes,
  zustandNodes,
  externalEdges,
  zustandEdges,
  areEdgesReady,
}) => {
  // Determine if external or internal nodes should be used
  // IMPORTANT: No memoization here - nodes need to update for position changes!
  const nodes = externalNodes ?? zustandNodes;

  // Determine edges with readiness check and memoization
  const edges = useMemo(
    () => (areEdgesReady ? (externalEdges ?? zustandEdges) : []),
    [areEdgesReady, externalEdges, zustandEdges],
  );

  return {
    nodes,
    edges,
  };
};

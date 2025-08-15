/**
 * useNodeAndEdgeTypes.js
 * Custom hook for memoizing node and edge types
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

import { useMemo } from 'react';

import { createNodeTypes, edgeTypes as sharedEdgeTypes } from '@/flow/nodeRegistry.jsx';

/**
 * Custom hook for managing and memoizing node and edge types
 * @param {Object} externalNodeTypes - External node types if provided
 * @param {Object} externalEdgeTypes - External edge types if provided
 * @returns {Object} Object containing memoized nodeTypes and edgeTypes
 */
export const useNodeAndEdgeTypes = ({ externalNodeTypes, externalEdgeTypes }) => {
  // Memoize node types
  const nodeTypes = useMemo(() => {
    // If external node types are provided, use them directly
    if (externalNodeTypes) {
      return externalNodeTypes;
    }
    // Otherwise, create standard node types
    // Ultra mode and LOD are managed by injecting `lodLevel` into each node's data,
    // so no HOC (`withLOD`) is needed here
    return createNodeTypes(false); // `false` indicates we're not in ultra mode at node type level
  }, [externalNodeTypes]);

  // Memoize edge types
  const edgeTypes = useMemo(() => {
    // If external edge types are provided, use them directly
    if (externalEdgeTypes) {
      return externalEdgeTypes;
    }
    // Otherwise, use shared edge types
    // LOD is managed through edge props, so no HOC is needed
    return sharedEdgeTypes;
  }, [externalEdgeTypes]);

  return {
    nodeTypes,
    edgeTypes,
  };
};

import { useMemo } from 'react';

/**
 * Hook de virtualización de nodos de alto rendimiento.
 * OPTIMIZED: Removed viewport dependency to prevent re-renders during panning
 * Now returns all nodes/edges without viewport-based filtering to avoid re-renders
 *
 * @param {Array} allNodes - La lista COMPLETA de nodos del flujo.
 * @param {Array} allEdges - La lista COMPLETA de aristas del flujo.
 * @param {Object} containerSize - El tamaño del contenedor del canvas ({ width, height }).
 * @returns {{ visibleNodes: Array, visibleEdges: Array }} - Los nodos y aristas filtrados que deben renderizarse.
 */
const useNodeVirtualization = ({
  nodes: allNodes,
  edges: allEdges,
  // viewport removed - was causing 111 renders/sec during panning
  containerDimensions: containerSize,
}) => {
  // OPTIMIZED: Return all nodes/edges without viewport filtering
  // This prevents re-renders during panning at the cost of rendering more elements
  // ReactFlow's internal virtualization will handle performance

  const { width: containerWidth, height: containerHeight } = containerSize ?? {};

  return useMemo(() => {
    // OPTIMIZED: Return all nodes/edges without viewport-based filtering
    // This eliminates re-renders during panning (was 111 renders/sec)
    // ReactFlow's internal virtualization will handle performance

    // If container dimensions are not ready, return empty arrays
    if (!containerWidth || !containerHeight) {
      return { visibleNodes: [], visibleEdges: [] };
    }

    // Return all nodes and edges - no viewport filtering
    // This prevents re-renders during panning
    return {
      visibleNodes: allNodes ?? [],
      visibleEdges: allEdges ?? [],
    };
  }, [allNodes, allEdges, containerWidth, containerHeight]);
};

export default useNodeVirtualization;

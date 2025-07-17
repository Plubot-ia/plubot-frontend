import { useState, useEffect, useRef, useMemo } from 'react';

import { nodeEstimatedDimensions } from '@/flow/nodeDimensions';

const OVERSCAN_PX = 400; // Aumentar el área de overscan para una experiencia más fluida

/**
 * Hook de virtualización de nodos de alto rendimiento.
 * Calcula qué nodos y aristas son visibles dentro del viewport actual,
 * utilizando dimensiones estimadas para evitar el renderizado inicial masivo.
 *
 * @param {Array} allNodes - La lista COMPLETA de nodos del flujo.
 * @param {Array} allEdges - La lista COMPLETA de aristas del flujo.
 * @param {Object} viewport - El objeto viewport de React Flow (x, y, zoom).
 * @param {Object} containerSize - El tamaño del contenedor del canvas ({ width, height }).
 * @returns {{ visibleNodes: Array, visibleEdges: Array }} - Los nodos y aristas filtrados que deben renderizarse.
 */
const useNodeVirtualization = ({
  nodes: allNodes,
  edges: allEdges,
  viewport,
  containerDimensions: containerSize,
}) => {
  const [throttledViewport, setThrottledViewport] = useState(viewport);
  const throttleTimeout = useRef(undefined);

  useEffect(() => {
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
    }

    throttleTimeout.current = setTimeout(() => {
      setThrottledViewport(viewport);
      throttleTimeout.current = undefined;
    }, 50); // 50ms throttle delay

    return () => {
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current);
      }
    };
  }, [viewport]);

  const { x, y, zoom } = throttledViewport; // Use the throttled viewport
  const { width: containerWidth, height: containerHeight } = containerSize;

  return useMemo(() => {
    if (!containerWidth || !containerHeight || zoom === 0) {
      return { visibleNodes: [], visibleEdges: [] };
    }

    const viewBounds = {
      left: -x / zoom - OVERSCAN_PX / zoom,
      right: (-x + containerWidth) / zoom + OVERSCAN_PX / zoom,
      top: -y / zoom - OVERSCAN_PX / zoom,
      bottom: (-y + containerHeight) / zoom + OVERSCAN_PX / zoom,
    };

    // 1. Find all nodes that are currently within the viewport bounds.
    const nodesInView = allNodes.filter((node) => {
      if (!node.position) return false;

      const nodeWidth =
        node.width ||
        nodeEstimatedDimensions[node.type]?.width ||
        nodeEstimatedDimensions.default.width;
      const nodeHeight =
        node.height ||
        nodeEstimatedDimensions[node.type]?.height ||
        nodeEstimatedDimensions.default.height;

      const nodeBounds = {
        left: node.position.x,
        right: node.position.x + nodeWidth,
        top: node.position.y,
        bottom: node.position.y + nodeHeight,
      };

      return (
        nodeBounds.left < viewBounds.right &&
        nodeBounds.right > viewBounds.left &&
        nodeBounds.top < viewBounds.bottom &&
        nodeBounds.bottom > viewBounds.top
      );
    });

    const nodesInViewIds = new Set(nodesInView.map((n) => n.id));

    // 2. Find all edges that are connected to at least one of the visible nodes.
    const edgesToRender = allEdges.filter(
      (edge) =>
        nodesInViewIds.has(edge.source) || nodesInViewIds.has(edge.target),
    );

    // 3. Create a set of all nodes that need to be rendered.
    // This includes the nodes in view and all nodes connected by the edges we just found.
    // This guarantees that if an edge is rendered, both its source and target nodes are also rendered.
    const requiredNodeIds = new Set(nodesInViewIds);
    for (const edge of edgesToRender) {
      requiredNodeIds.add(edge.source);
      requiredNodeIds.add(edge.target);
    }

    const nodesToRender = allNodes.filter((node) =>
      requiredNodeIds.has(node.id),
    );

    return { visibleNodes: nodesToRender, visibleEdges: edgesToRender };
  }, [allNodes, allEdges, x, y, zoom, containerWidth, containerHeight]);
};

export default useNodeVirtualization;

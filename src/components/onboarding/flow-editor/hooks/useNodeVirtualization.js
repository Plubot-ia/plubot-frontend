import { useState, useEffect, useRef } from 'react';

import { useMemo } from 'react';
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
const useNodeVirtualization = ({ nodes: allNodes, edges: allEdges, viewport, containerDimensions: containerSize }) => {
  const [throttledViewport, setThrottledViewport] = useState(viewport);
  const throttleTimeout = useRef(null);

  useEffect(() => {
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
    }

    throttleTimeout.current = setTimeout(() => {
      setThrottledViewport(viewport);
      throttleTimeout.current = null;
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

    const visibleNodes = allNodes.filter(node => {
      if (!node.position) return false;

      const nodeWidth = node.width || nodeEstimatedDimensions[node.type]?.width || nodeEstimatedDimensions.default.width;
      const nodeHeight = node.height || nodeEstimatedDimensions[node.type]?.height || nodeEstimatedDimensions.default.height;

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

    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

    const visibleEdges = allEdges.filter(edge =>
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );

    return { visibleNodes, visibleEdges };

  }, [allNodes, allEdges, x, y, zoom, containerWidth, containerHeight]);
};

export default useNodeVirtualization;

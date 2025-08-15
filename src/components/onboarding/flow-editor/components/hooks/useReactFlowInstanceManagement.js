/**
 * useReactFlowInstanceManagement.js
 * Custom hook for managing ReactFlow instance and related operations
 * ULTRA-OPTIMIZED: Uses store API to avoid re-renders completely
 *
 * @version 3.0.0
 */

import { useCallback } from 'react';
import { useStoreApi } from 'reactflow';

import { createTransform } from '../../utils/d3Transform';
import { calculateNodeBounds, calculateViewport } from '../../utils/viewportHelpers';

/**
 * Custom hook for managing ReactFlow instance and viewport operations
 * Provides zoom controls and fitView functionality
 * @returns {Object} ReactFlow instance with zoom methods
 */
export const useReactFlowInstanceManagement = () => {
  const store = useStoreApi(); // Get store API which doesn't cause re-renders

  // Helper to get viewport transform
  const getViewport = useCallback(() => {
    const { transform } = store.getState();
    return {
      x: transform[0],
      y: transform[1],
      zoom: transform[2],
    };
  }, [store]);

  // Helper to set viewport with animation
  const setViewport = useCallback(
    (viewport, options = {}) => {
      const state = store.getState();
      const { d3Zoom, d3Selection } = state;

      if (!d3Zoom || !d3Selection) {
        return;
      }

      const { x = 0, y = 0, zoom = 1 } = viewport;
      const { duration = 0 } = options;

      // Create a transform object that d3-zoom expects
      const nextTransform = createTransform(x, y, zoom);

      if (duration > 0 && d3Selection.transition) {
        d3Selection.transition().duration(duration).call(d3Zoom.transform, nextTransform);
      } else {
        d3Selection.call(d3Zoom.transform, nextTransform);
      }
    },
    [store],
  );

  // Zoom in function
  const zoomIn = useCallback(
    (options = {}) => {
      const state = store.getState();
      const { d3Zoom, d3Selection } = state;

      if (!d3Zoom || !d3Selection) {
        return;
      }

      const { duration = 0 } = options;

      if (duration > 0 && d3Selection.transition) {
        d3Selection.transition().duration(duration).call(d3Zoom.scaleBy, 1.2);
      } else {
        d3Selection.call(d3Zoom.scaleBy, 1.2);
      }
    },
    [store],
  );

  // Zoom out function
  const zoomOut = useCallback(
    (options = {}) => {
      const state = store.getState();
      const { d3Zoom, d3Selection } = state;

      if (!d3Zoom || !d3Selection) {
        return;
      }

      const { duration = 0 } = options;

      if (duration > 0 && d3Selection.transition) {
        d3Selection
          .transition()
          .duration(duration)
          .call(d3Zoom.scaleBy, 1 / 1.2);
      } else {
        d3Selection.call(d3Zoom.scaleBy, 1 / 1.2);
      }
    },
    [store],
  );

  // Fit view function - uses setViewport directly
  const fitView = useCallback(
    (options = {}) => {
      const state = store.getState();
      const { getNodes, domNode, minZoom, maxZoom } = state;

      // Get nodes using the getNodes function from store
      const nodes = getNodes ? getNodes() : [];

      if (!nodes || nodes.length === 0 || !domNode) {
        return Promise.resolve(false);
      }

      // Get bounds of all nodes
      const bounds = calculateNodeBounds(nodes);

      if (bounds.minX === Infinity) {
        return Promise.resolve(false);
      }

      const containerRect = domNode.getBoundingClientRect();
      const zoomLimits = { min: minZoom ?? 0.5, max: maxZoom ?? 2 };
      const viewport = calculateViewport(bounds, containerRect, options, zoomLimits);

      // Use setViewport to apply the transformation
      setViewport(viewport, options);

      return Promise.resolve(true);
    },
    [store, setViewport],
  );

  // Create stable methods that access store directly
  const reactFlowInstance = {
    getViewport,
    setViewport,
    zoomIn,
    zoomOut,
    fitView,
    getNodes: () => store.getState().nodes,
    getEdges: () => store.getState().edges,
    getNode: (id) => store.getState().nodeInternals.get(id),
    getEdge: (id) => store.getState().edges.find((edge) => edge.id === id),
  };

  return {
    reactFlowInstance,
    // Also expose individual methods for convenience
    fitView: reactFlowInstance.fitView,
    getViewport: reactFlowInstance.getViewport,
    setViewport: reactFlowInstance.setViewport,
  };
};

/**
 * useAutomaticCentering.js - Hook for automatic viewport centering
 */
import { useCallback, useRef } from 'react';

/**
 * Custom hook for automatic centering of ReactFlow viewport
 * @param {Array} nodes - Array of nodes to center
 * @param {Function} fitView - ReactFlow fitView function
 * @returns {Object} - Object containing performAutomaticCentering function
 */
export const useAutomaticCentering = (nodes, fitView) => {
  // Single-execution centering solution - only on initial load
  const hasCenteredRef = useRef(false);

  // Extract centering logic to separate function to reduce complexity
  const performAutomaticCentering = useCallback(() => {
    // Prevent multiple executions
    if (hasCenteredRef.current) {
      return;
    }
    hasCenteredRef.current = true;

    try {
      // Get ReactFlow instance and container
      const reactFlowInstance = globalThis.reactFlowInstance ?? {};
      const container = document.querySelector('.react-flow');
      const containerRect = container?.getBoundingClientRect();

      if (!reactFlowInstance.setViewport || !containerRect) {
        return;
      }

      // Calculate nodes bounding box
      const nodePositions = nodes.map((n) => ({
        x: n.position.x,
        y: n.position.y,
        width: n.width ?? 0,
        height: n.height ?? 0,
      }));

      const minX = Math.min(...nodePositions.map((n) => n.x));
      const maxX = Math.max(...nodePositions.map((n) => n.x + n.width));
      const minY = Math.min(...nodePositions.map((n) => n.y));
      const maxY = Math.max(...nodePositions.map((n) => n.y + n.height));

      // Calculate optimal viewport
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      const padding = 0.2; // 20% padding
      const availableWidth = containerWidth * (1 - padding * 2);
      const availableHeight = containerHeight * (1 - padding * 2);

      const scaleX = availableWidth / (maxX - minX);
      const scaleY = availableHeight / (maxY - minY);
      const optimalZoom = Math.min(scaleX, scaleY, 1.5); // Max zoom 1.5x

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const viewportX = containerWidth / 2 - centerX * optimalZoom;
      const viewportY = containerHeight / 2 - centerY * optimalZoom;

      // Apply centering immediately
      reactFlowInstance.setViewport({
        x: viewportX,
        y: viewportY,
        zoom: optimalZoom,
      });

      // Backup with animation
      setTimeout(() => {
        if (reactFlowInstance.setViewport) {
          reactFlowInstance.setViewport(
            {
              x: viewportX,
              y: viewportY,
              zoom: optimalZoom,
            },
            { duration: 500 },
          );
        }
      }, 200);
    } catch {
      // Fallback to fitView if manual centering fails
      fitView?.({ padding: 0.2, duration: 300 });
    }
  }, [nodes, fitView]);

  return {
    performAutomaticCentering,
  };
};

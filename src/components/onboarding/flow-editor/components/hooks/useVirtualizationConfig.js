/**
 * useVirtualizationConfig.js
 * Custom hook for managing node virtualization configuration
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

import { useMemo } from 'react';

/**
 * Custom hook for managing node virtualization configuration
 * Prepares and memoizes the configuration object for useNodeVirtualization
 * OPTIMIZED: Removed viewport to prevent re-renders during panning
 *
 * @param {Array} nodes - Flow nodes array
 * @param {Array} edges - Flow edges array
 * @param {number} containerWidth - Container width
 * @param {number} containerHeight - Container height
 * @returns {Object} Configuration object for useNodeVirtualization
 */
export const useVirtualizationConfig = ({ nodes, edges, containerWidth, containerHeight }) => {
  const virtualizationConfig = useMemo(
    () => ({
      nodes,
      edges,
      // viewport removed - was causing 111 renders/sec during panning
      containerDimensions: { width: containerWidth, height: containerHeight },
      // Additional options for virtualization hook if needed in the future
    }),
    [nodes, edges, containerWidth, containerHeight],
  );

  return virtualizationConfig;
};

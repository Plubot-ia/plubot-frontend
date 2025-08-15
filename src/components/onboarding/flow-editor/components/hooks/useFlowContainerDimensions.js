/**
 * useFlowContainerDimensions.js
 * Custom hook for managing flow container dimensions and viewport
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

// OPTIMIZED: Removed useViewport import to prevent re-renders during panning
import useResizeObserver from 'use-resize-observer';

/**
 * Custom hook for managing flow container dimensions
 * OPTIMIZED: Removed viewport subscription to prevent re-renders during panning
 *
 * @returns {Object} Object containing flowWrapperReference, containerWidth, containerHeight
 */
export const useFlowContainerDimensions = () => {
  // Container size observation
  const {
    ref: flowWrapperReference,
    width: containerWidth,
    height: containerHeight,
  } = useResizeObserver();

  // OPTIMIZED: Removed viewport subscription that was causing 111 renders/second during panning
  // Viewport is not needed for container dimensions and was causing excessive re-renders

  return {
    flowWrapperReference,
    containerWidth,
    containerHeight,
    // viewport removed - was causing re-renders on every pan frame
  };
};

/**
 * useInitialFitView.js
 * Custom hook for managing initial flow view centering
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.1.0
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing initial flow view centering
 * Centers the view only on initial load, avoiding automatic readjustment when moving nodes
 * Improved timing and robustness for better centering after data load
 *
 * @param {Array} nodes - Flow nodes array
 * @param {Function} fitView - ReactFlow fitView function
 * @param {Object} fitViewOptions - Options for fitView (default: { duration: 300, padding: 0.15 })
 */
export const useInitialFitView = (nodes, fitView, _fitViewOptions) => {
  const isInitialLoad = useRef(true);
  const hasTriedFitView = useRef(false);
  const hasNodesBeenLoaded = useRef(false);

  // Use fitViewOptions directly or provide defaults inline

  // Robust fit view function with multiple attempts and forced centering
  const performFitView = useCallback(() => {
    if (!fitView || hasTriedFitView.current) return;

    // Mark that we've attempted fitView
    hasTriedFitView.current = true;

    // Multiple aggressive attempts to ensure centering works
    const attemptFitView = (delay = 0, attemptOptions = {}) => {
      setTimeout(() => {
        if (fitView) {
          try {
            // Force fitView with aggressive options
            fitView({
              padding: 0.2,
              includeHiddenNodes: false,
              minZoom: 0.1,
              maxZoom: 2,
              duration: 300,
              ...attemptOptions,
            });
          } catch {
            // Silently handle fitView failures
          }
        }
      }, delay);
    };

    // Multiple attempts with different timings and options
    attemptFitView(0, { duration: 0 }); // Immediate, no animation
    attemptFitView(50, { duration: 200 }); // Quick animation
    attemptFitView(200, { duration: 300 }); // Standard animation
    attemptFitView(500, { duration: 400, padding: 0.25 }); // Final attempt with more padding
    attemptFitView(1000, { duration: 0, padding: 0.15 }); // Last resort, no animation
  }, [fitView]);

  // Effect to center the view when nodes are available
  // Fixed timing issue: center when nodes are actually loaded, not just on initial load
  useEffect(() => {
    // Center the view when:
    // 1. We have nodes available AND
    // 2. We haven't tried fitView yet AND
    // 3. FitView function is available
    if (nodes.length > 0 && !hasTriedFitView.current && fitView) {
      hasNodesBeenLoaded.current = true;

      // Multiple delays to ensure proper mounting and centering
      setTimeout(() => {
        performFitView();
        isInitialLoad.current = false; // Mark that initial load has passed
      }, 150); // Increased delay for better DOM mounting

      // Additional aggressive centering attempts
      setTimeout(() => {
        fitView?.({ padding: 0.3, duration: 0 }); // Immediate with more padding
      }, 300);

      setTimeout(() => {
        fitView?.({ padding: 0.2, duration: 500 }); // Slow animation for final positioning
      }, 600);
    }
  }, [nodes, fitView, performFitView]); // Depends on nodes to ensure it executes when they are loaded

  return {
    isInitialLoad,
  };
};

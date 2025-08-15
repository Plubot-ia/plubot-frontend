/**
 * useFlowMainContainer.js
 * Custom hook for managing FlowMain container configuration
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

import { useMemo } from 'react';

/**
 * Custom hook for managing FlowMain container properties
 * Centralizes container configuration, styling, and reference management
 *
 * @param {Object} flowContainerReference - Reference to the flow container
 * @returns {Object} Container configuration
 */
export const useFlowMainContainer = (flowContainerReference) => {
  const containerConfig = useMemo(
    () => ({
      className: 'flow-main',
      ref: flowContainerReference,
      style: {
        width: '100%',
        height: '100%',
        minHeight: '500px',
      },
    }),
    [flowContainerReference],
  );

  return containerConfig;
};

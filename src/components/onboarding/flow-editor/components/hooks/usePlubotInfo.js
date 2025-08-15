/**
 * usePlubotInfo.js
 * Custom hook for managing plubot information and flow ID
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

import { useMemo } from 'react';

/**
 * Custom hook for managing plubot information and flow ID
 * @param {Object} project - Project object with id and name
 * @param {string} plubotId - Plubot ID
 * @param {string} flowName - Flow name
 * @returns {Object} Object containing plubotInfo and flowId
 */
export const usePlubotInfo = ({ project, plubotId, flowName }) => {
  /**
   * Object with plubot information for modals
   */
  const plubotInfo = useMemo(
    () => ({
      id: project?.id || plubotId,
      name: project?.name || flowName || 'Flujo sin nombre',
    }),
    [project, plubotId, flowName],
  );

  // Flow ID (same as plubot ID)
  const flowId = project?.id || plubotId;

  return {
    plubotInfo,
    flowId,
  };
};

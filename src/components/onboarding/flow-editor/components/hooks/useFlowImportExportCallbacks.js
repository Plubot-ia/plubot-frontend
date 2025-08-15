/**
 * useFlowImportExportCallbacks.js
 * Custom hook for managing flow import and export callback functions
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

import { useCallback } from 'react';

import { handleFlowExport, handleFlowImport } from '../flowImportExportHelpers';

/**
 * Custom hook for managing flow import and export callbacks
 * @param {Object} params - Parameters for the hook
 * @param {Function} params.onSave - Save function
 * @param {Array} params.nodes - Flow nodes
 * @param {Array} params.edges - Flow edges
 * @param {string} params.flowId - Flow ID
 * @param {Object} params.plubotInfo - Plubot information
 * @param {Function} params.startTransition - React transition function
 * @param {Function} params.setNodes - Nodes setter function
 * @param {Function} params.setEdges - Edges setter function
 * @param {Function} params.externalCloseModal - Modal close function
 * @returns {Object} Object containing onExport and onImport callbacks
 */
export const useFlowImportExportCallbacks = ({
  onSave,
  nodes,
  edges,
  flowId,
  plubotInfo,
  startTransition,
  setNodes,
  setEdges,
  externalCloseModal,
}) => {
  // Export callback
  const onExport = useCallback(
    () => handleFlowExport({ onSave, nodes, edges, flowId, plubotInfo }),
    [onSave, nodes, edges, flowId, plubotInfo],
  );

  // Import callback
  const onImport = useCallback(
    (data) =>
      handleFlowImport({
        data,
        startTransition,
        setNodes,
        setEdges,
        externalCloseModal,
      }),
    [startTransition, setNodes, setEdges, externalCloseModal],
  );

  return {
    onExport,
    onImport,
  };
};

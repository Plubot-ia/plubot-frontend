/**
 * useFlowEventHandlersConfig.js
 * Custom hook for managing Flow event handlers configuration
 * Extracted from FlowMain for substantial line reduction
 *
 * @version 1.0.0
 */

import { useFlowEventHandlers } from './useFlowEventHandlers';

/**
 * Custom hook for Flow event handlers configuration
 * Centralizes all flow event handlers preparation logic
 *
 * @param {Object} params - All required parameters for flow event handlers
 * @returns {Object} Flow event handlers
 */
export const useFlowEventHandlersConfig = ({
  externalOnEdgesChange,
  externalOnConnect,
  externalOnNodeClick,
  externalOnPaneClick,
  externalOnEdgeClick,
  externalOnNodeDragStart,
  externalOnNodeDrag,
  externalOnNodeDragStop,
  externalOnDragOver,
  externalOnDrop,
  externalOnEdgeUpdate,
  externalOnEdgeUpdateStart,
  externalOnEdgeUpdateEnd,
  externalOnNodesDelete,
  externalOnEdgesDelete,
  externalOnSelectionChange,
  externalValidConnectionsHandles,
  isDragging,
  setIsDragging,
  closeContextMenu,
  handlePaneClickForMenu,
}) => {
  return useFlowEventHandlers({
    externalOnEdgesChange,
    externalOnConnect,
    externalOnNodeClick,
    externalOnPaneClick,
    externalOnEdgeClick,
    externalOnNodeDragStart,
    externalOnNodeDrag,
    externalOnNodeDragStop,
    externalOnDragOver,
    externalOnDrop,
    externalOnEdgeUpdate,
    externalOnEdgeUpdateStart,
    externalOnEdgeUpdateEnd,
    externalOnNodesDelete,
    externalOnEdgesDelete,
    externalOnSelectionChange,
    externalValidConnectionsHandles,
    isDragging,
    setIsDragging,
    closeContextMenu,
    handlePaneClickForMenu,
  });
};

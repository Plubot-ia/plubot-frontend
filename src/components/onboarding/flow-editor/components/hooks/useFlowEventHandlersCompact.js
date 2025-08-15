/**
 * useFlowEventHandlersCompact.js
 * Ultra-consolidated hook for flow event handlers configuration
 * Extracted from FlowMain for major line reduction to reach 125-line target
 *
 * @version 1.0.0
 */

import { useFlowEventHandlersConfig } from './useFlowEventHandlersConfig';

/**
 * Ultra-consolidated hook for flow event handlers configuration
 * Compacts all event handler parameters into a single configuration object
 *
 * @param {Object} externalHandlers - All external event handlers
 * @param {Object} internalHandlers - All internal event handlers
 * @returns {Object} Event handlers configuration
 */
export const useFlowEventHandlersCompact = ({ externalHandlers, internalHandlers }) => {
  return useFlowEventHandlersConfig({
    externalOnEdgesChange: externalHandlers.onEdgesChange,
    externalOnConnect: externalHandlers.onConnect,
    externalOnNodeClick: externalHandlers.onNodeClick,
    externalOnPaneClick: externalHandlers.onPaneClick,
    externalOnEdgeClick: externalHandlers.onEdgeClick,
    externalOnNodeDragStart: externalHandlers.onNodeDragStart,
    externalOnNodeDrag: externalHandlers.onNodeDrag,
    externalOnNodeDragStop: externalHandlers.onNodeDragStop,
    externalOnDragOver: externalHandlers.onDragOver,
    externalOnDrop: externalHandlers.onDrop,
    externalOnEdgeUpdate: externalHandlers.onEdgeUpdate,
    externalOnEdgeUpdateStart: externalHandlers.onEdgeUpdateStart,
    externalOnEdgeUpdateEnd: externalHandlers.onEdgeUpdateEnd,
    externalOnNodesDelete: externalHandlers.onNodesDelete,
    externalOnEdgesDelete: externalHandlers.onEdgesDelete,
    externalOnSelectionChange: externalHandlers.onSelectionChange,
    externalValidConnectionsHandles: externalHandlers.validConnectionsHandles,
    isDragging: internalHandlers.isDragging,
    setIsDragging: internalHandlers.setIsDragging,
    closeContextMenu: internalHandlers.closeContextMenu,
    handlePaneClickForMenu: internalHandlers.handlePaneClickForMenu,
  });
};

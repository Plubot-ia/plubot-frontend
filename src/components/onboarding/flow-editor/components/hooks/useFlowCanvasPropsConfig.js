/**
 * useFlowCanvasPropsConfig.js
 * Custom hook for managing FlowCanvas props configuration
 * Extracted from FlowMain for massive line reduction
 *
 * @version 1.0.0
 */

import { useFlowCanvasProps } from './useFlowCanvasProps';

/**
 * Custom hook for FlowCanvas props configuration
 * Centralizes all FlowCanvas props preparation logic
 *
 * @param {Object} params - All required parameters for FlowCanvas
 * @returns {Object} FlowCanvas props
 */
export const useFlowCanvasPropsConfig = ({
  nodesWithLOD,
  edgesWithLOD,
  nodeTypes,
  edgeTypes,
  eventHandlers,
  minZoom,
  reactFlowInstanceReference,
  setReactFlowInstanceFromStore,
  externalSetReactFlowInstance,
  isUltraMode,
  visibleNodes,
  visibleEdges,
  menu,
  closeContextMenu,
  fpsRef,
  optimizationLevel,
  flowWrapperReference,
}) => {
  return useFlowCanvasProps({
    nodesWithLOD,
    edgesWithLOD,
    nodeTypes,
    edgeTypes,
    eventHandlers,
    minZoom,
    reactFlowInstanceReference,
    setReactFlowInstanceFromStore,
    externalSetReactFlowInstance,
    isUltraMode,
    visibleNodes,
    visibleEdges,
    menu,
    closeContextMenu,
    fpsRef,
    optimizationLevel,
    flowWrapperReference,
  });
};

/**
 * useFlowCanvasProps.js
 * Custom hook for preparing FlowCanvas component props
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

import { useMemo } from 'react';

/**
 * Custom hook for preparing FlowCanvas component props
 * @param {Object} params - Parameters for the hook
 * @returns {Object} Object containing all FlowCanvas props
 */
export const useFlowCanvasProps = ({
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
  const flowCanvasProps = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return flowCanvasProps;
};

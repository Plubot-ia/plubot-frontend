/**
 * useFlowMainConfigurationFinal.js
 * Final ultra-consolidated hook for all remaining FlowMain configurations
 * Extracted from FlowMain for final major line reduction to reach 125-line target
 *
 * @version 1.0.0
 */

import { useFlowCanvasPropsConfig } from './useFlowCanvasPropsConfig';
import { useFlowMainContainer } from './useFlowMainContainer';
import { useFlowSidebarControlsPropsConfig } from './useFlowSidebarControlsPropsConfig';

/**
 * Final ultra-consolidated hook for all remaining FlowMain configurations
 * Centralizes canvas props, sidebar props, and container configuration
 *
 * @param {Object} params - All required parameters for final configurations
 * @returns {Object} All final configuration results
 */
export const useFlowMainConfigurationFinal = ({
  // Canvas props params
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
  // Sidebar props params
  handleToggleUltraMode,
  reactFlowInstance,
  undo,
  redo,
  canUndo,
  canRedo,
  externalShowEmbedModal,
  externalCloseModal,
  flowId,
  plubotInfo,
  externalShowImportExportModal,
  onExport,
  onImport,
  // Container params
  flowContainerReference,
}) => {
  // Canvas configuration
  const flowCanvasProps = useFlowCanvasPropsConfig({
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

  // Sidebar configuration
  const flowSidebarControlsProps = useFlowSidebarControlsPropsConfig({
    isUltraMode,
    handleToggleUltraMode,
    reactFlowInstance,
    undo,
    redo,
    canUndo,
    canRedo,
    externalShowEmbedModal,
    externalCloseModal,
    flowId,
    plubotInfo,
    externalShowImportExportModal,
    onExport,
    onImport,
  });

  // Container configuration
  const containerProps = useFlowMainContainer(flowContainerReference);

  return {
    flowCanvasProps,
    flowSidebarControlsProps,
    containerProps,
  };
};

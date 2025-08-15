/**
 * useFlowSidebarControlsPropsConfig.js
 * Custom hook for managing FlowSidebarControls props configuration
 * Extracted from FlowMain for massive line reduction
 *
 * @version 1.0.0
 */

import { useFlowSidebarControlsProps } from './useFlowSidebarControlsProps';

/**
 * Custom hook for FlowSidebarControls props configuration
 * Centralizes all FlowSidebarControls props preparation logic
 *
 * @param {Object} params - All required parameters for FlowSidebarControls
 * @returns {Object} FlowSidebarControls props
 */
export const useFlowSidebarControlsPropsConfig = ({
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
}) => {
  return useFlowSidebarControlsProps({
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
};

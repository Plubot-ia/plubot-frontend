/**
 * useFlowSidebarControlsProps.js
 * Custom hook for preparing FlowSidebarControls component props
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

import { useMemo } from 'react';

/**
 * Custom hook for preparing FlowSidebarControls component props
 * @param {Object} params - Parameters for the hook
 * @returns {Object} Object containing all FlowSidebarControls props
 */
export const useFlowSidebarControlsProps = ({
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
  const flowSidebarControlsProps = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return flowSidebarControlsProps;
};

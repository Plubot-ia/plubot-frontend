/**
 * useAllHooksConfiguration.js
 * Ultra-massive hook for consolidating ALL remaining hook configurations
 * Extracted from FlowMain for ultra-aggressive line reduction
 *
 * @version 1.0.0
 */

import { useFlowImportExportCallbacks } from './useFlowImportExportCallbacks';
import { useVirtualizationConfig } from './useVirtualizationConfig';

/**
 * Ultra-massive hook for consolidating ALL remaining hook configurations
 * Centralizes multiple hook configurations to massively reduce FlowMain lines
 *
 * @param {Object} params - All required parameters
 * @returns {Object} All consolidated hook results
 */
export const useAllHooksConfiguration = ({
  // Import/Export params
  onSave,
  nodes,
  edges,
  flowId,
  plubotInfo,
  startTransition,
  setNodes,
  setEdges,
  externalCloseModal,
  // Virtualization params
  // viewport removed - was causing re-renders during panning
  containerWidth,
  containerHeight,
}) => {
  // Import/Export callbacks
  const { onExport, onImport } = useFlowImportExportCallbacks({
    onSave,
    nodes,
    edges,
    flowId,
    plubotInfo,
    startTransition,
    setNodes,
    setEdges,
    externalCloseModal,
  });

  // Virtualization config - OPTIMIZED: viewport removed
  const virtualizationConfig = useVirtualizationConfig({
    nodes,
    edges,
    // viewport removed to prevent re-renders
    containerWidth,
    containerHeight,
  });

  return {
    onExport,
    onImport,
    virtualizationConfig,
  };
};

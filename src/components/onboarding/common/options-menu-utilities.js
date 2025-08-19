/**
 * Utility functions for OptionsMenu
 */

// Menu action handler
export const handleMenuAction = (handler) => {
  if (typeof handler === 'function') {
    handler();
  }
};

// Export flow handler
export const handleExportFlow = (nodes, edges, plubotId, onClose) => {
  const flowData = {
    nodes: nodes || [],
    edges: edges || [],
    plubotId,
    exportDate: new Date().toISOString(),
    version: '1.0',
  };

  const blob = new Blob([JSON.stringify(flowData, undefined, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flow-${plubotId}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  if (typeof onClose === 'function') onClose();
};

// Clear flow handler
export const handleClearFlow = (nodes, edges, clearFlow, onClose) => {
  const shouldClear = nodes?.length > 0 || edges?.length > 0;
  if (shouldClear && clearFlow) {
    clearFlow();
    if (typeof onClose === 'function') onClose();
  }
};

// Duplicate nodes handler
export const handleDuplicateNodes = (nodes, duplicateSelectedNodes, onClose) => {
  const selectedNodes = (nodes || []).filter((node) => node.selected);
  if (selectedNodes.length > 0 && duplicateSelectedNodes) {
    duplicateSelectedNodes();
    if (typeof onClose === 'function') onClose();
  }
};

// Copy flow ID handler
export const handleCopyFlowId = async (plubotId, setShowNotification) => {
  try {
    await navigator.clipboard.writeText(plubotId);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  } catch {
    // Failed to copy
  }
};

// Get flow complexity helper
export const getFlowComplexity = (nodes, edges) => {
  const nodeCount = nodes?.length || 0;
  // Mark edgeCount as unused to avoid lint warnings
  const _edgeCount = edges?.length || 0;

  if (nodeCount === 0) return 'Vacío';
  if (nodeCount <= 5) return 'Simple';
  if (nodeCount <= 15) return 'Moderado';
  if (nodeCount <= 30) return 'Complejo';
  return 'Muy complejo';
};

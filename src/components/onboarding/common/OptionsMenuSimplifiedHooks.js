/**
 * Custom hooks for OptionsMenuSimplified
 */
import { useEffect, useCallback } from 'react';

// Custom hook for portal setup
export const usePortalSetup = (portalRef, anchorRef, setMenuPosition, onClose) => {
  useEffect(() => {
    const container = document.createElement('div');
    container.className = 'options-menu-portal';
    document.body.append(container);
    portalRef.current = container;

    return () => {
      if (container.parentNode) {
        container.remove();
      }
    };
  }, [portalRef]);

  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [anchorRef, setMenuPosition]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
};

// Custom hook for export flow
export const useExportFlow = ({ flowNodes, flowEdges, nodes, edges }, plubotId, onClose) => {
  return useCallback(() => {
    const flowData = {
      nodes: flowNodes || nodes || [],
      edges: flowEdges || edges || [],
      plubotId,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(flowData, undefined, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flow-${plubotId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    if (typeof onClose === 'function') onClose();
  }, [flowNodes, flowEdges, nodes, edges, plubotId, onClose]);
};

// Custom hook for copy flow ID
export const useCopyFlowId = (plubotId, setShowCopyNotification) => {
  return useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plubotId);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    } catch {
      // Failed to copy
    }
  }, [plubotId, setShowCopyNotification]);
};

// Custom hook for clear flow
export const useClearFlow = (flowNodes, flowEdges, clearFlow, onClose) => {
  return useCallback(() => {
    const shouldClear = flowNodes?.length > 0 || flowEdges?.length > 0;
    if (shouldClear) {
      clearFlow();
      if (typeof onClose === 'function') onClose();
    }
  }, [flowNodes, flowEdges, clearFlow, onClose]);
};

// Custom hook for duplicate nodes
export const useDuplicateNodes = (flowNodes, nodes, duplicateSelectedNodes, onClose) => {
  return useCallback(() => {
    const selectedNodes = (flowNodes || nodes || []).filter((node) => node.selected);
    if (selectedNodes.length > 0) {
      duplicateSelectedNodes();
      if (typeof onClose === 'function') onClose();
    }
  }, [flowNodes, nodes, duplicateSelectedNodes, onClose]);
};

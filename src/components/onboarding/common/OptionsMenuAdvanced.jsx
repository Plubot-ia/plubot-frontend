import PropTypes from 'prop-types';
import React, { useState, useCallback, useRef, useEffect } from 'react';

import useFlowStore from '@/stores/use-flow-store';

import {
  useFlowAnalytics,
  useKeyboardShortcuts,
  useRecentActions,
  useNodeSearch,
  useMenuPosition,
  useMenuHandlers,
} from './OptionsMenuAdvancedHooks';
import { OptionsMenuAdvancedModal } from './OptionsMenuAdvancedModal';

// Helper function to export flow
const exportFlowToFile = (nodes, edges, plubotId) => {
  const exportData = {
    nodes,
    edges,
    timestamp: Date.now(),
    plubotId,
    version: '1.0',
  };
  const blob = new Blob([JSON.stringify(exportData, undefined, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flow-${plubotId}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

import './OptionsMenuAdvanced.css';

const OptionsMenuAdvanced = ({
  anchorRef,
  plubotId = 'unknown',
  nodes,
  edges,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('actions');
  const [copiedId, setCopiedId] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const searchInputRef = useRef();

  const { clearFlow, setNodes, reactFlowInstance } = useFlowStore((state) => ({
    clearFlow: state.clearFlow,
    setNodes: state.setNodes,
    reactFlowInstance: state.reactFlowInstance,
  }));

  // Custom hooks
  const analytics = useFlowAnalytics(nodes, edges);
  const { searchQuery, searchResults, handleNodeSearch } = useNodeSearch(
    nodes,
    reactFlowInstance,
    setNodes,
  );
  const { recentActions, addRecentAction } = useRecentActions();
  const menuPosition = useMenuPosition(anchorRef, isOpen);

  // Keyboard shortcuts
  useKeyboardShortcuts(isOpen, activeTab, setActiveTab, searchInputRef);

  // Event handlers
  const handleClose = useCallback(() => {
    onClose();
    setShowBackupManager(false);
  }, [onClose]);

  const handleExportFlow = useCallback(() => {
    exportFlowToFile(nodes, edges, plubotId);
    addRecentAction('Flujo exportado');
  }, [nodes, edges, plubotId, addRecentAction]);

  const handleCopyId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plubotId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      addRecentAction('ID copiado');
    } catch {
      // Error copying to clipboard
    }
  }, [plubotId, addRecentAction]);

  const handlers = useMenuHandlers({
    clearFlow,
    addRecentAction,
    setShowBackupManager,
    reactFlowInstance,
    handleExportFlow,
  });

  // Menu toggle handled by parent
  useEffect(() => {
    // Component receives isOpen as prop
  }, []);

  if (!isOpen) return;

  return (
    <OptionsMenuAdvancedModal
      isOpen={isOpen}
      onClose={handleClose}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      copiedId={copiedId}
      showBackupManager={showBackupManager}
      setShowBackupManager={setShowBackupManager}
      menuPosition={menuPosition}
      analytics={analytics}
      searchQuery={searchQuery}
      searchResults={searchResults}
      recentActions={recentActions}
      showMinimap={showMinimap}
      showGrid={showGrid}
      showAdvancedMetrics={showAdvancedMetrics}
      setShowMinimap={setShowMinimap}
      setShowGrid={setShowGrid}
      setShowAdvancedMetrics={setShowAdvancedMetrics}
      handleExportFlow={handleExportFlow}
      handleCopyId={handleCopyId}
      handleClear={handlers.handleClear}
      handleDuplicate={handlers.handleDuplicate}
      handleExport={handlers.handleExport}
      handleUndo={handlers.handleUndo}
      handleRedo={handlers.handleRedo}
      handleBackup={handlers.handleBackup}
      handleRefresh={handlers.handleRefresh}
      handleAutoLayout={handlers.handleAutoLayout}
      handleNodeSearch={handleNodeSearch}
      searchInputRef={searchInputRef}
      plubotId={plubotId}
    />
  );
};

OptionsMenuAdvanced.propTypes = {
  anchorRef: PropTypes.object,
  plubotId: PropTypes.string,
  nodes: PropTypes.array,
  edges: PropTypes.array,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default OptionsMenuAdvanced;

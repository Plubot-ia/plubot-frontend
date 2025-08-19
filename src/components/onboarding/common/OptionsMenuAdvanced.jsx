import PropTypes from 'prop-types';
import React, { useState, useCallback, useRef, useEffect } from 'react';

import useFlowStore from '@/stores/use-flow-store';

import {
  useFlowAnalytics,
  useKeyboardShortcuts,
  useRecentActions,
  useNodeSearch,
  useMenuPosition,
} from './OptionsMenuAdvancedHooks';
import { OptionsMenuAdvancedModal } from './OptionsMenuAdvancedModal';

import './OptionsMenuAdvanced.css';

const OptionsMenuAdvanced = ({ anchorRef, plubotId = 'unknown', nodes, edges, isOpen, onClose }) => {
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
  const { searchQuery, searchResults, handleNodeSearch } = useNodeSearch(nodes, reactFlowInstance, setNodes);
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

  const handleClear = useCallback(() => {
    const shouldClear =
      globalThis.window?.confirm?.('¿Estás seguro de que quieres limpiar todo el flujo?') ?? false;
    if (shouldClear && clearFlow) {
      clearFlow();
      addRecentAction('Flujo limpiado');
    }
  }, [clearFlow, addRecentAction]);

  const handleDuplicate = useCallback(() => {
    // TODO: Implement node duplication logic
    addRecentAction('Nodos duplicados');
  }, [addRecentAction]);

  const handleExport = useCallback(() => {
    handleExportFlow();
  }, [handleExportFlow]);

  const handleUndo = useCallback(() => {
    // TODO: Implement undo logic
    addRecentAction('Deshacer acción');
  }, [addRecentAction]);

  const handleRedo = useCallback(() => {
    // TODO: Implement redo logic
    addRecentAction('Rehacer acción');
  }, [addRecentAction]);

  const handleBackup = useCallback(() => {
    setShowBackupManager(true);
    addRecentAction('Gestor de backups abierto');
  }, [addRecentAction]);

  const handleRefresh = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView();
      addRecentAction('Vista actualizada');
    }
  }, [reactFlowInstance, addRecentAction]);

  const handleAutoLayout = useCallback(() => {
    // TODO: Implement auto layout logic
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
      addRecentAction('Auto layout aplicado');
    }
  }, [reactFlowInstance, addRecentAction]);

  // Listen for menu toggle event
  useEffect(() => {
    const handleMenuToggle = () => {
      // This component receives isOpen as a prop, doesn't manage it internally
      // The toggle is handled by the parent component
    };
    
    globalThis.addEventListener('epic-menu-toggle', handleMenuToggle);
    return () => {
      globalThis.removeEventListener('epic-menu-toggle', handleMenuToggle);
    };
  }, []);

  if (!isOpen) return null;

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
      handleClear={handleClear}
      handleDuplicate={handleDuplicate}
      handleExport={handleExport}
      handleUndo={handleUndo}
      handleRedo={handleRedo}
      handleBackup={handleBackup}
      handleRefresh={handleRefresh}
      handleNodeSearch={handleNodeSearch}
      handleAutoLayout={handleAutoLayout}
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

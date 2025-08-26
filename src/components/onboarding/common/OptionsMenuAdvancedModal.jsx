/**
 * Modal wrapper component for OptionsMenuAdvanced
 */
import { X } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import BackupManager from '../flow-editor/components/BackupManager';

import { ActionsTab } from './OptionsMenuAdvanced/ActionsTab';
import { AnalyticsTab } from './OptionsMenuAdvanced/AnalyticsTab';
import { MenuTabs } from './OptionsMenuAdvanced/MenuTabs';
import { SettingsTab } from './OptionsMenuAdvanced/SettingsTab';
import { ToolsTab } from './OptionsMenuAdvanced/ToolsTab';

export const OptionsMenuAdvancedModal = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  copiedId,
  showBackupManager,
  setShowBackupManager,
  menuPosition,
  analytics,
  searchQuery,
  searchResults: _searchResults,
  recentActions,
  showMinimap,
  showGrid,
  showAdvancedMetrics,
  setShowMinimap,
  setShowGrid,
  setShowAdvancedMetrics,
  handleExportFlow: _handleExportFlow,
  handleCopyId,
  handleClear,
  handleDuplicate,
  handleExport,
  handleUndo,
  handleRedo,
  handleBackup,
  handleRefresh,
  handleNodeSearch,
  handleAutoLayout,
  searchInputRef: _searchInputRef,
  plubotId,
}) => {
  const portalRef = useRef(document.createElement('div'));

  useEffect(() => {
    const element = portalRef.current;
    document.body.append(element);
    return () => element.remove();
  }, []);

  if (!isOpen) return;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'actions': {
        return (
          <ActionsTab
            handleDuplicate={handleDuplicate}
            handleExport={handleExport}
            handleClear={handleClear}
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            handleBackup={handleBackup}
            handleRefresh={handleRefresh}
            recentActions={recentActions}
          />
        );
      }
      case 'analytics': {
        return (
          <AnalyticsTab
            flowMetrics={analytics}
            plubotId={plubotId}
            copiedId={copiedId}
            handleCopyId={handleCopyId}
            showAdvancedMetrics={showAdvancedMetrics}
          />
        );
      }
      case 'tools': {
        return (
          <ToolsTab
            searchQuery={searchQuery}
            handleNodeSearch={handleNodeSearch}
            handleAutoLayout={handleAutoLayout}
          />
        );
      }
      case 'settings': {
        return (
          <SettingsTab
            showMinimap={showMinimap}
            setShowMinimap={setShowMinimap}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            showAdvancedMetrics={showAdvancedMetrics}
            setShowAdvancedMetrics={setShowAdvancedMetrics}
          />
        );
      }
      default:
    }
  };

  return ReactDOM.createPortal(
    <>
      <div
        className='options-menu-overlay'
        onClick={onClose}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
        role='button'
        tabIndex={0}
        aria-label='Close menu'
      />
      <div className='options-menu-advanced' style={menuPosition}>
        <div className='menu-header'>
          <h3>Opciones Avanzadas</h3>
          <button type='button' onClick={onClose} className='close-button' aria-label='Close'>
            <X size={20} />
          </button>
        </div>

        <MenuTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className='tab-content'>{renderTabContent()}</div>

        {showBackupManager && (
          <BackupManager isOpen={showBackupManager} onClose={() => setShowBackupManager(false)} />
        )}
      </div>
    </>,
    portalRef.current,
  );
};

OptionsMenuAdvancedModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  copiedId: PropTypes.bool.isRequired,
  showBackupManager: PropTypes.bool.isRequired,
  setShowBackupManager: PropTypes.func.isRequired,
  menuPosition: PropTypes.object.isRequired,
  analytics: PropTypes.object.isRequired,
  searchQuery: PropTypes.string.isRequired,
  searchResults: PropTypes.array.isRequired,
  recentActions: PropTypes.array.isRequired,
  showMinimap: PropTypes.bool.isRequired,
  showGrid: PropTypes.bool.isRequired,
  showAdvancedMetrics: PropTypes.bool.isRequired,
  setShowMinimap: PropTypes.func.isRequired,
  setShowGrid: PropTypes.func.isRequired,
  setShowAdvancedMetrics: PropTypes.func.isRequired,
  handleExportFlow: PropTypes.func.isRequired,
  handleCopyId: PropTypes.func.isRequired,
  handleClear: PropTypes.func.isRequired,
  handleDuplicate: PropTypes.func.isRequired,
  handleExport: PropTypes.func.isRequired,
  handleUndo: PropTypes.func.isRequired,
  handleRedo: PropTypes.func.isRequired,
  handleBackup: PropTypes.func.isRequired,
  handleRefresh: PropTypes.func.isRequired,
  handleNodeSearch: PropTypes.func.isRequired,
  handleAutoLayout: PropTypes.func.isRequired,
  searchInputRef: PropTypes.object,
  plubotId: PropTypes.string.isRequired,
};

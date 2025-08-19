/**
 * Helper components for OptionsMenu
 */
import { History, Database, Settings, BarChart2, Shield, Clock, Copy } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import { handleMenuAction } from './options-menu-utilities';
import { ExportFlowButton, ClearFlowButton, DuplicateNodesButton } from './OptionsMenuActions';

// Render menu items section
export const MenuItemsSection = ({
  onOpenVersionHistory,
  onOpenBackupRestore,
  onOpenSettings,
  onOpenPathAnalysis,
  onOpenStatistics,
  onOpenPermissions,
  onExportFlow,
  onClearFlow,
  onDuplicateNodes,
  hasSelection,
  _plubotId,
  _nodes,
  _edges,
  _onClose,
}) => (
  <>
    <button
      className='epic-header-dropdown-item clickable'
      type='button'
      onClick={(event) => {
        event.stopPropagation();
        handleMenuAction(onOpenVersionHistory);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background 0.2s',
      }}
    >
      <History size={16} />
      <span>Version History</span>
    </button>

    <button
      className='epic-header-dropdown-item clickable'
      type='button'
      onClick={(event) => {
        event.stopPropagation();
        handleMenuAction(onOpenBackupRestore);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background 0.2s',
      }}
    >
      <Database size={16} />
      <span>Backup & Restore</span>
    </button>

    <button
      className='epic-header-dropdown-item clickable'
      type='button'
      onClick={(event) => {
        event.stopPropagation();
        handleMenuAction(onOpenSettings);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background 0.2s',
      }}
    >
      <Settings size={16} />
      <span>Flow Settings</span>
    </button>

    <button
      className='epic-header-dropdown-item clickable'
      type='button'
      onClick={(event) => {
        event.stopPropagation();
        handleMenuAction(onOpenPathAnalysis);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background 0.2s',
      }}
    >
      <BarChart2 size={16} />
      <span>Path Analysis</span>
    </button>

    <button
      className='epic-header-dropdown-item clickable'
      type='button'
      onClick={(event) => {
        event.stopPropagation();
        handleMenuAction(onOpenStatistics);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background 0.2s',
      }}
    >
      <BarChart2 size={16} />
      <span>Flow Statistics</span>
    </button>

    <button
      className='epic-header-dropdown-item clickable'
      type='button'
      onClick={(event) => {
        event.stopPropagation();
        handleMenuAction(onOpenPermissions);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background 0.2s',
      }}
    >
      <Shield size={16} />
      <span>Permissions</span>
    </button>

    <div className='epic-header-dropdown-divider' />

    <ExportFlowButton onClick={() => onExportFlow(_nodes, _edges, _plubotId)} />

    {hasSelection && <DuplicateNodesButton onClick={() => onDuplicateNodes(_onClose)} />}

    <ClearFlowButton onClick={() => onClearFlow(_onClose)} />
  </>
);

MenuItemsSection.propTypes = {
  onOpenVersionHistory: PropTypes.func,
  onOpenBackupRestore: PropTypes.func,
  onOpenSettings: PropTypes.func,
  onOpenPathAnalysis: PropTypes.func,
  onOpenStatistics: PropTypes.func,
  onOpenPermissions: PropTypes.func,
  onExportFlow: PropTypes.func,
  onClearFlow: PropTypes.func,
  onDuplicateNodes: PropTypes.func,
  hasSelection: PropTypes.bool,
  _plubotId: PropTypes.string,
  _nodes: PropTypes.array,
  _edges: PropTypes.array,
  _onClose: PropTypes.func,
};

// Flow info display component
export const FlowInfoDisplay = ({ plubotId, nodes, edges, lastSaved, onCopyId }) => (
  <div className='flow-info-section'>
    <div className='flow-info-header'>
      <Clock size={14} />
      <span>Flow Information</span>
    </div>
    <div className='flow-info-content'>
      <div className='flow-info-row'>
        <span>ID:</span>
        <button type='button' onClick={onCopyId} className='flow-id-copy' title='Click to copy'>
          {plubotId}
          <Copy size={12} />
        </button>
      </div>
      <div className='flow-info-row'>
        <span>Nodes:</span>
        <span>{nodes?.length || 0}</span>
      </div>
      <div className='flow-info-row'>
        <span>Edges:</span>
        <span>{edges?.length || 0}</span>
      </div>
      {lastSaved && (
        <div className='flow-info-row'>
          <span>Last Saved:</span>
          <span>{new Date(lastSaved).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  </div>
);

FlowInfoDisplay.propTypes = {
  plubotId: PropTypes.string,
  nodes: PropTypes.array,
  edges: PropTypes.array,
  lastSaved: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCopyId: PropTypes.func,
};

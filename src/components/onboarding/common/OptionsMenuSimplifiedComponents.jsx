/**
 * Extracted components for OptionsMenuSimplified to reduce complexity
 */
import { Save, Download, RefreshCw, Trash2, Copy, Layers, Clock, GitBranch } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

export const BackupManagerButton = ({ onAction, onClose }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={(event) => {
      event.stopPropagation();
      onAction();
      if (typeof onClose === 'function') onClose();
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    }}
  >
    <Save size={16} />
    <span>Backup Manager</span>
  </button>
);

BackupManagerButton.propTypes = {
  onAction: PropTypes.func.isRequired,
  onClose: PropTypes.func,
};

export const ExportFlowButton = ({ onExport }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={(event) => {
      event.stopPropagation();
      onExport();
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    }}
  >
    <Download size={16} />
    <span>Export Flow</span>
  </button>
);

ExportFlowButton.propTypes = {
  onExport: PropTypes.func.isRequired,
};

export const DuplicateNodesButton = ({ hasSelection, onDuplicate }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={(event) => {
      event.stopPropagation();
      onDuplicate();
    }}
    disabled={!hasSelection}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '6px',
      cursor: hasSelection ? 'pointer' : 'not-allowed',
      opacity: hasSelection ? 1 : 0.5,
      transition: 'background-color 0.2s',
    }}
  >
    <Copy size={16} />
    <span>Duplicate Selected</span>
  </button>
);

DuplicateNodesButton.propTypes = {
  hasSelection: PropTypes.bool.isRequired,
  onDuplicate: PropTypes.func.isRequired,
};

export const RefreshFlowButton = ({ onRefresh }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={(event) => {
      event.stopPropagation();
      onRefresh();
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    }}
  >
    <RefreshCw size={16} />
    <span>Refresh Flow</span>
  </button>
);

RefreshFlowButton.propTypes = {
  onRefresh: PropTypes.func.isRequired,
};

export const ClearFlowButton = ({ onClear }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={(event) => {
      event.stopPropagation();
      onClear();
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      color: '#ef4444',
    }}
  >
    <Trash2 size={16} />
    <span>Clear Flow</span>
  </button>
);

ClearFlowButton.propTypes = {
  onClear: PropTypes.func.isRequired,
};

export const FlowInfoSection = ({
  plubotId,
  nodes,
  edges,
  lastSaved,
  onCopyId,
  showCopyNotification,
}) => (
  <div style={{ padding: '8px 12px', fontSize: '12px', opacity: 0.8 }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '4px',
        cursor: 'pointer',
      }}
      onClick={(event) => {
        event.stopPropagation();
        onCopyId();
      }}
      role='button'
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onCopyId();
        }
      }}
    >
      <span style={{ fontWeight: 600 }}>Flow ID:</span>
      <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{plubotId}</span>
      <Copy size={12} style={{ opacity: 0.6 }} />
      {showCopyNotification && <span style={{ color: '#10b981', fontSize: '11px' }}>Copied!</span>}
    </div>
    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Layers size={12} />
        <span>{nodes?.length || 0} nodes</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <GitBranch size={12} />
        <span>{edges?.length || 0} edges</span>
      </div>
      {lastSaved && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} />
          <span>{new Date(lastSaved).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  </div>
);

FlowInfoSection.propTypes = {
  plubotId: PropTypes.string.isRequired,
  nodes: PropTypes.array,
  edges: PropTypes.array,
  lastSaved: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCopyId: PropTypes.func.isRequired,
  showCopyNotification: PropTypes.bool,
};

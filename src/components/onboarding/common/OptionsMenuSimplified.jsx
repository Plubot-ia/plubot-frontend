import PropTypes from 'prop-types';
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';

import useFlowStore from '@/stores/use-flow-store';

import BackupManager from '../flow-editor/components/BackupManager';

import {
  BackupManagerButton,
  ExportFlowButton,
  DuplicateNodesButton,
  RefreshFlowButton,
  ClearFlowButton,
  FlowInfoSection,
} from './OptionsMenuSimplifiedHelpers';
import {
  usePortalSetup,
  useExportFlow,
  useCopyFlowId,
  useClearFlow,
  useDuplicateNodes,
} from './OptionsMenuSimplifiedHooks';

// Helper function to calculate menu position
const _calculateMenuPosition = (anchorRef) => {
  if (anchorRef?.current) {
    const rect = anchorRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    };
  }
  return { top: 60, right: 20 };
};

const OptionsMenuSimplified = ({ nodes, edges, plubotId, lastSaved, anchorRef, onClose }) => {
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const portalRef = useRef(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);

  const {
    nodes: flowNodes,
    edges: flowEdges,
    clearFlow,
    duplicateSelectedNodes,
  } = useFlowStore((state) => ({
    nodes: state.nodes,
    edges: state.edges,
    clearFlow: state.clearFlow,
    duplicateSelectedNodes: state.duplicateSelectedNodes,
  }));

  // Setup portal and positioning
  usePortalSetup(portalRef, anchorRef, setMenuPosition, onClose);

  // Action handlers
  const handleExportFlow = useExportFlow({ flowNodes, flowEdges, nodes, edges }, plubotId, onClose);
  const handleCopyFlowId = useCopyFlowId(plubotId, setShowCopyNotification);
  const handleClearFlow = useClearFlow(flowNodes, flowEdges, clearFlow, onClose);
  const handleDuplicateNodes = useDuplicateNodes(flowNodes, nodes, duplicateSelectedNodes, onClose);

  const hasSelection = (flowNodes || nodes || []).some((node) => node.selected);

  const menuContent = (
    <div
      className='epic-header-dropdown-menu'
      role='menu'
      tabIndex={-1}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && typeof onClose === 'function') {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: `${menuPosition.top}px`,
        right: `${menuPosition.right}px`,
        zIndex: 2_147_483_647,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(0, 195, 255, 0.3)',
        borderRadius: '8px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        minWidth: '280px',
        padding: '8px 0',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <BackupManagerButton onAction={() => setShowBackupManager(true)} onClose={onClose} />

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />

      <ExportFlowButton onExport={handleExportFlow} />
      <DuplicateNodesButton hasSelection={hasSelection} onDuplicate={handleDuplicateNodes} />
      <RefreshFlowButton onRefresh={() => globalThis.location.reload()} />
      <ClearFlowButton onClear={handleClearFlow} />

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />

      <FlowInfoSection
        plubotId={plubotId}
        nodes={nodes}
        edges={edges}
        lastSaved={lastSaved}
        onCopyId={handleCopyFlowId}
        showCopyNotification={showCopyNotification}
      />
    </div>
  );

  return (
    <>
      {/* Render menu using portal */}
      {portalRef.current && ReactDOM.createPortal(menuContent, portalRef.current)}

      {/* Backup Manager Modal */}
      {showBackupManager && (
        <BackupManager isOpen={showBackupManager} onClose={() => setShowBackupManager(false)} />
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

OptionsMenuSimplified.propTypes = {
  plubotId: PropTypes.string,
  nodes: PropTypes.array,
  edges: PropTypes.array,
  lastSaved: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  anchorRef: PropTypes.object,
  onClose: PropTypes.func,
};

export default React.memo(OptionsMenuSimplified);

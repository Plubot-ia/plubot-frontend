import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import useFlowStore from '@/stores/use-flow-store';

import BackupManager from '../flow-editor/components/BackupManager';

import {
  handleExportFlow,
  handleClearFlow,
  handleDuplicateNodes,
  handleCopyFlowId,
} from './options-menu-utilities';
import {
  BackupButton,
  VersionHistoryButton,
  ImportExportButton,
  SettingsButton,
  PathAnalysisButton,
} from './OptionsMenuButtons';
import { FlowStatsSection } from './OptionsMenuStats';

const OptionsMenu = ({
  plubotId,
  onOpenVersionHistory,
  onOpenImportExport,
  onOpenSettingsModal,
  onOpenPathAnalysis,
  onOpenHelp,
  nodes,
  edges,
  lastSaved,
  anchorRef,
  onClose,
}) => {
  // OptionsMenu - handlers received
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const portalRef = useRef(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);

  const { clearFlow, duplicateSelectedNodes } =
    useFlowStore?.((state) => ({
      clearFlow: state.clearFlow,
      duplicateSelectedNodes: state.duplicateSelectedNodes,
    })) || {};

  useEffect(() => {
    // Crear el contenedor del portal si no existe
    if (!portalRef.current) {
      portalRef.current = document.createElement('div');
      portalRef.current.id = 'options-menu-portal';
      document.body.append(portalRef.current);
    }

    // Calcular posición basada en el anchorRef si está disponible
    if (anchorRef && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 5,
        right: window.innerWidth - rect.right,
      });
    }

    // Cleanup al desmontar
    return () => {
      if (portalRef.current && portalRef.current.parentNode) {
        portalRef.current.remove();
      }
    };
  }, [anchorRef]);

  useEffect(() => {
    // OptionsMenu montado/actualizado
  }, [
    showBackupManager,
    onOpenVersionHistory,
    onOpenImportExport,
    onOpenSettingsModal,
    onOpenPathAnalysis,
    onOpenHelp,
  ]);

  const handleBackupClick = () => {
    setShowBackupManager(true);
    if (onClose) onClose();
  };

  const handleMenuAction = (callback) => {
    if (callback && typeof callback === 'function') {
      callback();
    }
    onClose?.();
  };

  const _onExportFlow = () => handleExportFlow(nodes, edges, plubotId, onClose);
  const _onCopyFlowId = () => handleCopyFlowId(plubotId, setShowCopyNotification);
  const _onClearFlow = () => handleClearFlow(nodes, edges, clearFlow, onClose);
  const _onDuplicateNodes = () => handleDuplicateNodes(nodes, duplicateSelectedNodes, onClose);

  const menuContent = (
    <div
      className='options-menu open'
      onClick={(event) => {
        event.stopPropagation();
        onClose?.();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose?.();
        }
      }}
      role='menu'
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: `${menuPosition.top}px`,
        left: `${menuPosition.right}px`,
        zIndex: 999_999,
      }}
    >
      <BackupButton onClick={handleBackupClick} />

      <VersionHistoryButton onClick={() => handleMenuAction(onOpenVersionHistory)} />

      <ImportExportButton onClick={() => handleMenuAction(onOpenImportExport)} />

      <FlowStatsSection nodes={nodes} edges={edges} lastSaved={lastSaved} />

      <SettingsButton
        onClick={() => handleMenuAction(onOpenSettingsModal)}
        showCopyNotification={showCopyNotification}
      />

      <PathAnalysisButton onClick={() => handleMenuAction(onOpenPathAnalysis)} />

      {/* Modal de Backup Manager renderizado dentro del menú */}
      {showBackupManager && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
          }}
        >
          <BackupManager isOpen={showBackupManager} onClose={() => setShowBackupManager(false)} />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Renderizar el menú usando un portal */}
      {portalRef.current && ReactDOM.createPortal(menuContent, portalRef.current)}
    </>
  );
};

OptionsMenu.displayName = 'OptionsMenu';

OptionsMenu.propTypes = {
  plubotId: PropTypes.string,
  onOpenVersionHistory: PropTypes.func,
  onOpenImportExport: PropTypes.func,
  onOpenSettingsModal: PropTypes.func,
  onOpenPathAnalysis: PropTypes.func,
  onOpenHelp: PropTypes.func,
  nodes: PropTypes.array,
  edges: PropTypes.array,
  lastSaved: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  anchorRef: PropTypes.object,
  onClose: PropTypes.func,
};

export default React.memo(OptionsMenu);

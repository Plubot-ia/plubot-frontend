/**
 * FlowSidebarControls.jsx
 * Sidebar controls container for the Flow Editor
 * Extracted from FlowMain for better code organization
 *
 * @version 1.0.0
 */

import PropTypes from 'prop-types';

import ZoomControls from '../ui/ZoomControls';

import { renderEmbedModal, renderImportExportModal } from './flowModalHelpers';
import UltraModeButton from './UltraModeButton';

/**
 * FlowSidebarControls Component
 * Renders the sidebar controls including Ultra Mode button, Zoom controls, and modals
 */
const FlowSidebarControls = ({
  isUltraMode,
  handleToggleUltraMode,
  reactFlowInstance,
  undo,
  redo,
  canUndo,
  canRedo,
  externalShowEmbedModal,
  externalCloseModal,
  flowId,
  plubotInfo,
  externalShowImportExportModal,
  onExport,
  onImport,
}) => {
  return (
    <div
      className='vertical-buttons-container'
      style={{
        position: 'absolute',
        top: '80px',
        right: '10px',
        zIndex: 999,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Botón Ultra Rendimiento - Versión estable */}
      <div
        className='button-group'
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <UltraModeButton isUltraMode={isUltraMode} onToggle={handleToggleUltraMode} />
      </div>

      <div className='button-spacer' />

      {/* Componente ZoomControls */}
      <ZoomControls
        onUndo={undo}
        onRedo={redo}
        onZoomIn={() => reactFlowInstance.zoomIn({ duration: 300 })}
        onZoomOut={() => reactFlowInstance.zoomOut({ duration: 300 })}
        onFitView={() => reactFlowInstance.fitView({ duration: 300, padding: 0.1 })}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div className='button-spacer' />

      {/* Modal de compartir (EmbedModal) - Activado desde EpicHeader */}
      {renderEmbedModal({
        show: externalShowEmbedModal,
        externalCloseModal,
        flowId,
        plubotInfo,
      })}

      {/* Modal de importar/exportar - Activado desde EpicHeader */}
      {renderImportExportModal({
        show: externalShowImportExportModal,
        externalCloseModal,
        onExport,
        onImport,
      })}
    </div>
  );
};

FlowSidebarControls.propTypes = {
  isUltraMode: PropTypes.bool.isRequired,
  handleToggleUltraMode: PropTypes.func.isRequired,
  reactFlowInstance: PropTypes.object.isRequired,
  undo: PropTypes.func.isRequired,
  redo: PropTypes.func.isRequired,
  canUndo: PropTypes.bool.isRequired,
  canRedo: PropTypes.bool.isRequired,
  externalShowEmbedModal: PropTypes.bool,
  externalCloseModal: PropTypes.func,
  flowId: PropTypes.string,
  plubotInfo: PropTypes.object,
  externalShowImportExportModal: PropTypes.bool,
  onExport: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
};

export default FlowSidebarControls;

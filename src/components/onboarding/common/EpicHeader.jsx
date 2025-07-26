import {
  Save,
  Share2,
  Monitor,
  LayoutTemplate,
  MoreHorizontal,
} from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import '@fontsource/orbitron/400.css';

import useEpicHeader from '@/hooks/useEpicHeader';

import OptionsMenu from './OptionsMenu';
import StatusBubble from './StatusBubble';
import './EpicHeader.css';

/**
 * Helper para renderizar el header cuando el usuario no está autenticado.
 * @returns {JSX.Element} - Header no autenticado
 */
const _renderUnauthenticatedHeader = () => {
  return (
    <header className='epic-header epic-header-unauthenticated'>
      <div className='epic-header-left'>
        <img src='/logo.svg' alt='Logo' className='epic-header-logo' />
      </div>
      <div className='epic-header-center'>
        <span className='epic-header-flow-name'>Cargando...</span>
      </div>
      <div className='epic-header-right' />
    </header>
  );
};

/**
 * Helper para renderizar la sección izquierda del header (logo y título).
 * @param {Object} params - Parámetros de renderizado
 * @returns {JSX.Element} - Sección izquierda renderizada
 */
const _renderLeftSection = ({ logoSrc, handleLogoClick, displayFlowName }) => {
  return (
    <div className='epic-header-left'>
      <div
        role='button'
        tabIndex={0}
        onClick={handleLogoClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') handleLogoClick();
        }}
        style={{ cursor: 'pointer' }}
        title='Volver al editor'
        aria-label='Volver al editor'
      >
        <img
          src={logoSrc || '/logo.svg'}
          alt='Plubot Logo'
          className='epic-header-logo'
          loading='eager'
          draggable='false'
        />
      </div>
      <div
        role='button'
        tabIndex={0}
        onClick={handleLogoClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') handleLogoClick();
        }}
        style={{ cursor: 'pointer' }}
        title='Volver al editor'
      >
        <h1 className='epic-header-title'>{displayFlowName}</h1>
        <p className='epic-header-subtitle'>Diseñador de Flujos Avanzado</p>
      </div>
    </div>
  );
};

/**
 * Helper para renderizar la sección derecha del header (estadísticas).
 * @param {Object} params - Parámetros de renderizado
 * @returns {JSX.Element} - Sección derecha renderizada
 */
const _renderRightSection = ({
  nodeCount,
  edgeCount,
  formatLastSaved,
  formatTime,
}) => {
  return (
    <div className='epic-header-right'>
      <div className='epic-header-stats'>
        <div className='epic-stat'>
          <span className='epic-stat-value'>{nodeCount}</span>
          <span className='epic-stat-label'>Nodos</span>
        </div>

        <div className='epic-stat'>
          <span className='epic-stat-value'>{edgeCount}</span>
          <span className='epic-stat-label'>Conexiones</span>
        </div>

        <div className='epic-header-divider' />

        <div className='epic-stat'>
          <span className='epic-stat-value'>{formatLastSaved()}</span>
          <span className='epic-stat-label'>Guardado</span>
        </div>

        <div className='epic-stat'>
          <span className='epic-stat-value'>{formatTime()}</span>
          <span className='epic-stat-label'>Hora</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Helper para renderizar el botón de guardar.
 * @param {Object} params - Parámetros del botón
 * @returns {JSX.Element} - Botón de guardar renderizado
 */
const _renderSaveButton = ({
  isSaving,
  saveButtonStatusClass,
  handleSaveFlow,
}) => {
  return (
    <button
      className={`epic-header-button save-button ${isSaving ? 'saving' : ''} ${saveButtonStatusClass}`}
      onClick={handleSaveFlow}
      title='Guardar flujo'
      disabled={isSaving}
    >
      <Save size={16} className='epic-header-button-icon' />
      <span>Guardar</span>
    </button>
  );
};

/**
 * Helper para renderizar el botón de plantillas.
 * @param {Object} params - Parámetros del botón
 * @returns {JSX.Element} - Botón de plantillas renderizado
 */
const _renderTemplatesButton = ({
  openModal,
  finalTemplatesModal,
  showNotification,
}) => {
  return (
    <button
      className='epic-header-button'
      onClick={() => {
        try {
          openModal('templateSelector');

          if (typeof finalTemplatesModal === 'function') {
            try {
              finalTemplatesModal();
            } catch {}
          }

          try {
            globalThis.dispatchEvent(new CustomEvent('open-templates-modal'));
            globalThis.dispatchEvent(
              new CustomEvent('plubot-open-modal', {
                detail: {
                  modal: 'templateSelector',
                  source: 'EpicHeader',
                  timestamp: Date.now(),
                },
              }),
            );
          } catch {}
        } catch {
          showNotification('Error al abrir modal de plantillas', 'error');
        }
      }}
      title='Plantillas'
    >
      <LayoutTemplate size={16} className='epic-header-button-icon' />
      <span>Plantillas</span>
    </button>
  );
};

/**
 * Helper para renderizar el botón de simular.
 * @param {Object} params - Parámetros del botón
 * @returns {JSX.Element} - Botón de simular renderizado
 */
const _renderSimulateButton = ({
  openModal,
  finalSimulateModal,
  showNotification,
}) => {
  return (
    <button
      className='epic-header-button'
      onClick={() => {
        try {
          openModal('simulationModal');

          if (typeof finalSimulateModal === 'function') {
            try {
              finalSimulateModal();
            } catch {}
          }

          try {
            globalThis.dispatchEvent(new CustomEvent('open-simulate-modal'));
            globalThis.dispatchEvent(
              new CustomEvent('plubot-open-modal', {
                detail: {
                  modal: 'simulationModal',
                  source: 'EpicHeader',
                  timestamp: Date.now(),
                },
              }),
            );
          } catch {}
        } catch {
          showNotification('Error al iniciar simulación', 'error');
        }
      }}
      title='Simular flujo'
    >
      <Monitor size={16} className='epic-header-button-icon' />
      <span>Simular</span>
    </button>
  );
};

/**
 * Helper para renderizar el botón de compartir.
 * @param {Object} params - Parámetros del botón
 * @returns {JSX.Element} - Botón de compartir renderizado
 */
const _renderShareButton = ({
  openModal,
  finalShareModal,
  showNotification,
}) => {
  return (
    <button
      className='epic-header-button epic-header-button--share'
      onClick={() => {
        try {
          openModal('embedModal');

          if (typeof finalShareModal === 'function') {
            try {
              finalShareModal();
            } catch {}
          }

          try {
            globalThis.dispatchEvent(new CustomEvent('open-embed-modal'));
            globalThis.dispatchEvent(
              new CustomEvent('plubot-open-modal', {
                detail: {
                  modal: 'embedModal',
                  source: 'EpicHeader',
                  timestamp: Date.now(),
                },
              }),
            );
          } catch {}
        } catch {
          showNotification('Error al abrir modal de compartir', 'error');
        }
      }}
      title='Compartir flujo'
    >
      <Share2 size={16} className='epic-header-button-icon' />
      <span>Compartir</span>
    </button>
  );
};

/**
 * Helper para renderizar los botones de acción del header.
 * @param {Object} params - Parámetros de renderizado
 * @returns {JSX.Element} - Botones de acción renderizados
 */
const _renderActionButtons = ({
  isSaving,
  saveButtonStatusClass,
  handleSaveFlow,
  openModal,
  finalTemplatesModal,
  finalSimulateModal,
  finalShareModal,
  showNotification,
}) => {
  return (
    <div className='epic-header-actions'>
      {_renderSaveButton({ isSaving, saveButtonStatusClass, handleSaveFlow })}

      {_renderTemplatesButton({
        openModal,
        finalTemplatesModal,
        showNotification,
      })}

      {_renderSimulateButton({
        openModal,
        finalSimulateModal,
        showNotification,
      })}

      {_renderShareButton({ openModal, finalShareModal, showNotification })}
    </div>
  );
};

/**
 * Helper para renderizar el menú dropdown del header.
 * @param {Object} params - Parámetros de renderizado
 * @returns {JSX.Element} - Menú dropdown renderizado
 */
const _renderDropdownMenu = ({
  optionsMenuOpen,
  setOptionsMenuOpen,
  optionsMenuRef,
  plubotId,
  handleOpenVersionHistory,
  handleOpenImportExport,
  handleOpenSettingsModal,
  handleOpenPathAnalysis,
  nodes,
  edges,
  lastSaved,
}) => {
  return (
    <div className='epic-header-dropdown' ref={optionsMenuRef}>
      <button
        className='epic-header-button'
        onClick={() => setOptionsMenuOpen((previous) => !previous)}
        title='Más opciones'
      >
        <MoreHorizontal size={16} className='epic-header-button-icon' />
        <span>Más</span>
      </button>

      {optionsMenuOpen && (
        <OptionsMenu
          ref={optionsMenuRef}
          plubotId={plubotId}
          onOpenVersionHistory={handleOpenVersionHistory}
          onOpenImportExport={handleOpenImportExport}
          onOpenSettingsModal={handleOpenSettingsModal}
          onOpenPathAnalysis={handleOpenPathAnalysis}
          nodes={nodes}
          edges={edges}
          lastSaved={lastSaved}
        />
      )}
    </div>
  );
};

/**
 * Helper para renderizar el header principal completo.
 * @param {Object} params - Parámetros de renderizado
 * @returns {JSX.Element} - Header principal renderizado
 */
const _renderMainHeader = ({
  logoSrc,
  handleLogoClick,
  displayFlowName,
  nodeCount,
  edgeCount,
  formatLastSaved,
  formatTime,
  actionButtonsProps,
  dropdownMenuProps,
}) => {
  return (
    <header className='epic-header'>
      {_renderLeftSection({ logoSrc, handleLogoClick, displayFlowName })}

      {_renderRightSection({
        nodeCount,
        edgeCount,
        formatLastSaved,
        formatTime,
      })}

      {_renderActionButtons(actionButtonsProps)}

      {_renderDropdownMenu(dropdownMenuProps)}
    </header>
  );
};

const EpicHeader = (props) => {
  const {
    isAuthenticated,
    displayFlowName,
    nodeCount,
    edgeCount,
    optionsMenuOpen,
    setOptionsMenuOpen,
    optionsMenuRef,
    isSaving,
    saveStatus,
    notification,
    handleLogoClick,
    handleOpenVersionHistory,
    handleOpenImportExport,
    handleOpenSettingsModal,
    handleOpenPathAnalysis,
    formatLastSaved,
    formatTime,
    handleSaveFlow,
    finalTemplatesModal,
    finalSimulateModal,
    finalShareModal,
    openModal,
    showNotification,
    nodes,
    edges,
    lastSaved,
    plubotId,
  } = useEpicHeader(props);

  if (!isAuthenticated) {
    return _renderUnauthenticatedHeader();
  }

  const saveButtonStatusClass = saveStatus ? `status-${saveStatus}` : '';

  const actionButtonsProps = {
    isSaving,
    saveButtonStatusClass,
    handleSaveFlow,
    openModal,
    finalTemplatesModal,
    finalSimulateModal,
    finalShareModal,
    showNotification,
  };

  const dropdownMenuProps = {
    optionsMenuOpen,
    setOptionsMenuOpen,
    optionsMenuRef,
    plubotId,
    handleOpenVersionHistory,
    handleOpenImportExport,
    handleOpenSettingsModal,
    handleOpenPathAnalysis,
    nodes,
    edges,
    lastSaved,
  };

  return (
    <>
      <StatusBubble notification={notification} />
      {_renderMainHeader({
        logoSrc: props.logoSrc,
        handleLogoClick,
        displayFlowName,
        nodeCount,
        edgeCount,
        formatLastSaved,
        formatTime,
        actionButtonsProps,
        dropdownMenuProps,
      })}
    </>
  );
};

EpicHeader.propTypes = {
  logoSrc: PropTypes.string,
};

export default React.memo(EpicHeader);

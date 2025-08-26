import { Save, Share2, Monitor, LayoutTemplate, MoreHorizontal } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useRef, useMemo } from 'react';

import '@fontsource/orbitron/400.css';

import useEpicHeader from '@/hooks/useEpicHeader';
import { useRenderTracker } from '@/utils/renderTracker';

import OptionsMenuAdvanced from './OptionsMenuAdvanced';
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
const _renderRightSection = ({ nodeCount, edgeCount, formatLastSaved, formatTime }) => {
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
const _renderSaveButton = ({ isSaving, saveButtonStatusClass, handleSaveFlow }) => {
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
const _renderTemplatesButton = ({ openModal, finalTemplatesModal, showNotification }) => {
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
const _renderSimulateButton = ({ openModal, finalSimulateModal, showNotification }) => {
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
const _renderShareButton = ({ openModal, finalShareModal, showNotification }) => {
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
 * Helper para renderizar el botón del menú de opciones.
 * @param {Object} params - Parámetros de renderizado
 * @returns {JSX.Element} - Botón del menú renderizado
 */
const RenderOptionsMenuButton = (props) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const optionsMenuRef = React.useRef(null);
  const { plubotId, nodes, edges } = props;

  return (
    <div className='epic-header-right'>
      <button
        ref={optionsMenuRef}
        className='epic-header-button'
        onClick={(event) => {
          event.stopPropagation();
          setIsMenuOpen(true);
          globalThis.dispatchEvent(
            new CustomEvent('epic-menu-toggle', {
              detail: { action: 'toggle-menu' },
            }),
          );
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
        }}
        title='Más opciones'
      >
        <MoreHorizontal size={16} className='epic-header-button-icon' />
        <span>Más</span>
      </button>

      <OptionsMenuAdvanced
        anchorRef={optionsMenuRef}
        plubotId={plubotId}
        nodes={nodes}
        edges={edges}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  );
};

RenderOptionsMenuButton.propTypes = {
  plubotId: PropTypes.string,
  nodes: PropTypes.array,
  edges: PropTypes.array,
  optionsMenuRef: PropTypes.object,
  onOpenVersionHistory: PropTypes.func,
  onOpenImportExport: PropTypes.func,
  onOpenSettingsModal: PropTypes.func,
  onOpenPathAnalysis: PropTypes.func,
  lastSaved: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
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

      <RenderOptionsMenuButton {...dropdownMenuProps} />
    </header>
  );
};

const EpicHeaderComponent = React.memo(
  (props) => {
    // DEBUG: AGGRESSIVE tracking of EpicHeader renders during drag
    // Render logging temporarily disabled - was causing render cascade
    // console.log('🔥 [EpicHeader] RENDER DETECTED:', {
    //   timestamp: Date.now(),
    //   propsKeys: Object.keys(props).length,
    //   stackTrace: new Error().stack?.split('\n')[1]?.trim()
    // });

    // 🔄 RENDER TRACKING - Optimized to track only on mount
    useRenderTracker('EpicHeader');

    // Advanced render diagnostics to detect timer-based renders
    const _previousPropsRef = useRef({});
    // Diagnostic logging temporarily disabled - was causing render cascade
    // useEffect(() => {
    //   const diagnosticProps = {
    //     propsCount: Object.keys(props).length,
    //     hasTimer: false,
    //     timestamp: Date.now()
    //   };
    //   const renderRate = renderDiagnostics.trackRender('EpicHeader', diagnosticProps);
    //   if (renderRate > 1) {
    //     console.warn(`⏰ [EpicHeader] Frequent renders detected: ${renderRate.toFixed(1)}/s`, {
    //       propsKeys: Object.keys(props),
    //       possibleCauses: ['timer', 'unstable props', 'parent re-renders']
    //     });
    //   }
    //   renderDiagnostics.compareProps('EpicHeader', prevPropsRef.current, props);
    //   prevPropsRef.current = props;
    // });

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

    // Memoizar objetos para evitar recrearlos en cada render
    const saveButtonStatusClass = useMemo(() => {
      return saveStatus ? `status-${saveStatus}` : '';
    }, [saveStatus]);

    const actionButtonsProps = useMemo(
      () => ({
        isSaving,
        saveButtonStatusClass,
        handleSaveFlow,
        openModal,
        finalTemplatesModal,
        finalSimulateModal,
        finalShareModal,
        showNotification,
      }),
      [
        isSaving,
        saveButtonStatusClass,
        handleSaveFlow,
        openModal,
        finalTemplatesModal,
        finalSimulateModal,
        finalShareModal,
        showNotification,
      ],
    );

    const dropdownMenuProps = useMemo(
      () => ({
        optionsMenuOpen,
        setOptionsMenuOpen,
        optionsMenuRef,
        plubotId,
        onOpenVersionHistory: handleOpenVersionHistory,
        onOpenImportExport: handleOpenImportExport,
        onOpenSettingsModal: handleOpenSettingsModal,
        onOpenPathAnalysis: handleOpenPathAnalysis,
        nodes,
        edges,
        lastSaved,
      }),
      [
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
      ],
    );

    // OPTIMIZED: Memoize main header props
    const mainHeaderProps = useMemo(
      () => ({
        logoSrc: props.logoSrc,
        handleLogoClick,
        displayFlowName,
        nodeCount,
        edgeCount,
        formatLastSaved,
        formatTime,
        actionButtonsProps,
        dropdownMenuProps,
      }),
      [
        props.logoSrc,
        handleLogoClick,
        displayFlowName,
        nodeCount,
        edgeCount,
        formatLastSaved,
        formatTime,
        actionButtonsProps,
        dropdownMenuProps,
      ],
    );

    if (!isAuthenticated) {
      return _renderUnauthenticatedHeader();
    }

    return (
      <>
        <StatusBubble />
        {_renderMainHeader(mainHeaderProps)}
      </>
    );
  },
  (previousProps, nextProps) => {
    // ULTRA-AGGRESSIVE: Global throttling during intensive operations
    const now = Date.now();
    const GLOBAL_THROTTLE_MS = 150; // Throttle all renders during intensive operations

    // Use a global throttle map for EpicHeader
    if (!globalThis.epicHeaderThrottle) {
      globalThis.epicHeaderThrottle = { lastRender: 0 };
    }

    // If not enough time has passed, skip this render completely
    if (now - globalThis.epicHeaderThrottle.lastRender < GLOBAL_THROTTLE_MS) {
      return true; // Skip render (props are "equal")
    }

    // OPTIMIZED: Comprehensive comparison to prevent unnecessary renders during panning
    // EpicHeader should NOT re-render during viewport changes or node movements

    // Check if logoSrc changed (main prop)
    if (previousProps.logoSrc !== nextProps.logoSrc) {
      globalThis.epicHeaderThrottle.lastRender = now;
      return false; // Re-render needed
    }

    // Update throttle timestamp
    globalThis.epicHeaderThrottle.lastRender = now;

    // All other props are handled internally by useEpicHeader hook
    // which manages its own state, so we can safely ignore them
    // This prevents re-renders during panning/viewport changes
    return true; // No re-render needed
  },
);

EpicHeaderComponent.propTypes = {
  logoSrc: PropTypes.string,
};

EpicHeaderComponent.displayName = 'EpicHeader';

// Export the optimized component directly
const EpicHeader = EpicHeaderComponent;
EpicHeader.displayName = 'EpicHeader';

export default EpicHeader;

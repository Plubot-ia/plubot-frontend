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
  }

  const saveButtonStatusClass = saveStatus ? `status-${saveStatus}` : '';

  return (
    <>
      <StatusBubble notification={notification} />
      <header className='epic-header'>
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
              src={props.logoSrc || '/logo.svg'}
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

        <div className='epic-header-actions'>
          <button
            className={`epic-header-button save-button ${isSaving ? 'saving' : ''} ${saveButtonStatusClass}`}
            onClick={handleSaveFlow}
            title='Guardar flujo'
            disabled={isSaving}
          >
            <Save size={16} className='epic-header-button-icon' />
            <span>Guardar</span>
          </button>

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
                  globalThis.dispatchEvent(
                    new CustomEvent('open-templates-modal'),
                  );
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
                  globalThis.dispatchEvent(
                    new CustomEvent('open-simulate-modal'),
                  );
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
        </div>
      </header>
    </>
  );
};

EpicHeader.propTypes = {
  logoSrc: PropTypes.string,
};

export default React.memo(EpicHeader);

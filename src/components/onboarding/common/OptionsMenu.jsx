import { History, Database, Settings, BarChart2, Shield } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import BackupManager from '../flow-editor/components/BackupManager';

// Helper function to handle keyboard navigation
const _handleKeyDown = (event, callback) => {
  if (event.key === 'Enter' || event.key === ' ') {
    callback();
  }
};

// Helper function to render performance stats section
const _renderPerformanceStatsSection = ({ nodes, edges, lastSaved }) => (
  <div className='epic-header-dropdown-item'>
    <BarChart2 size={16} className='epic-header-dropdown-icon' />
    <span>Estadísticas de rendimiento</span>
    <div className='epic-header-dropdown-content'>
      <div className='performance-stats-mini'>
        <div className='performance-stats-row'>
          <span className='performance-stats-label'>Memoria estimada:</span>
          <span className='performance-stats-value'>
            {nodes.length * 2 + edges.length * 1.5} KB
          </span>
        </div>
        <div className='performance-stats-row'>
          <span className='performance-stats-label'>Tiempo de guardado:</span>
          <span className='performance-stats-value'>
            {lastSaved ? `${((Date.now() - new Date(lastSaved)) / 1000).toFixed(1)} s` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  </div>
);

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

  const handleMenuItemClick = (callback, callbackName) => {
    if (callback) {
      callback();
    } else {
    }
    if (onClose) onClose();
  };

  const handleMenuAction = (callback) => {
    try {
      if (callback) {
        callback();
      } else {
        // Callback no existe
      }
    } catch (error) {
      console.error('Error en handleMenuAction:', error);
    }
  };

  const menuContent = (
    <div
      className='epic-header-dropdown-menu'
      onClick={(e) => {
        // Menu container clicked
        e.stopPropagation();
      }}
      style={{
        position: 'fixed',
        top: `${menuPosition.top}px`,
        right: `${menuPosition.right}px`,
        zIndex: 2_147_483_647,
      }}
    >
      {/* Gestor de Backups */}
      <button
        className='epic-header-dropdown-item clickable'
        type='button'
        onClick={(e) => {
          console.log('Backup button clicked');
          e.stopPropagation();
          handleBackupClick();
        }}
        title='Crear y gestionar copias de seguridad del flujo'
        style={{
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          padding: '12px 16px',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 195, 255, 0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Shield size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
        <span>Gestor de Backups</span>
      </button>

      {/* Historial de versiones */}
      <button
        className='epic-header-dropdown-item clickable'
        type='button'
        onClick={() => {
          // Ejecutando handleOpenVersionHistory
          handleMenuAction(onOpenVersionHistory);
        }}
        title='Ver y restaurar versiones anteriores del flujo'
        style={{
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          padding: '12px 16px',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 195, 255, 0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <History size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
        <span>Historial de versiones</span>
      </button>

      {/* Importar / Exportar */}
      <button
        className='epic-header-dropdown-item clickable'
        type='button'
        onClick={() => {
          console.log('Import/Export clicked, handler type:', typeof onOpenImportExport);
          if (onOpenImportExport && typeof onOpenImportExport === 'function') {
            console.log('Calling onOpenImportExport');
            onOpenImportExport();
            onClose();
          } else {
            console.log('onOpenImportExport is not a function:', onOpenImportExport);
          }
        }}
        title='Importar flujos desde archivo o exportar el flujo actual'
        style={{
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          padding: '12px 16px',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 195, 255, 0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Database size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
        <span>Importar / Exportar</span>
      </button>

      {/* Estadísticas del flujo */}
      <div
        className='epic-header-dropdown-item'
        style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <BarChart2 size={16} className='epic-header-dropdown-icon' />
          <span style={{ fontWeight: 500 }}>Estadísticas del flujo</span>
        </div>
        <div style={{ fontSize: '13px', marginLeft: '24px', lineHeight: '1.5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Nodos:</span>
            <span style={{ color: '#00c3ff', fontWeight: 'bold' }}>{nodes?.length || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Conexiones:</span>
            <span style={{ color: '#00c3ff', fontWeight: 'bold' }}>{edges?.length || 0}</span>
          </div>
          {lastSaved && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                Último guardado:
              </span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                {new Date(lastSaved).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        className='epic-header-dropdown-item clickable'
        type='button'
        onClick={() => {
          // Ejecutando handleOpenSettings
          handleMenuAction(onOpenSettingsModal);
        }}
        title='Configurar opciones y parámetros del flujo'
        style={{
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          padding: '12px 16px',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 195, 255, 0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Settings size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
        <span>Configuración del flujo</span>
      </button>

      <button
        className='epic-header-dropdown-item clickable'
        type='button'
        onClick={() => {
          console.log('Path analysis clicked, handler type:', typeof onOpenPathAnalysis);
          if (onOpenPathAnalysis && typeof onOpenPathAnalysis === 'function') {
            console.log('Calling onOpenPathAnalysis');
            onOpenPathAnalysis();
            onClose();
          } else {
            console.log('onOpenPathAnalysis is not a function:', onOpenPathAnalysis);
          }
        }}
        title='Analizar las rutas y caminos posibles en el flujo'
        style={{
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          padding: '12px 16px',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 195, 255, 0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <BarChart2 size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
        <span>Análisis de rutas</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Renderizar el menú usando un portal */}
      {portalRef.current && ReactDOM.createPortal(menuContent, portalRef.current)}

      {/* Modal de Backup Manager */}
      {showBackupManager && (
        <BackupManager
          isOpen={showBackupManager}
          onClick={() => {
            console.log('Gestor de Backups clicked');
            setShowBackupManager(true);
            onClose();
          }}
        />
      )}
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
  nodes: PropTypes.array,
  edges: PropTypes.array,
  lastSaved: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  anchorRef: PropTypes.object,
  onClose: PropTypes.func,
};

export default React.memo(OptionsMenu);

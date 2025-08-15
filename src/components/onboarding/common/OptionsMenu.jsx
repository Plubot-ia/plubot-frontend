import { History, Database, Settings, BarChart2 } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import BackupManager from '@/components/flow/BackupManager';

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

const OptionsMenu = React.forwardRef(
  (
    {
      plubotId,
      onOpenVersionHistory,
      onOpenImportExport,
      onOpenSettingsModal,
      onOpenPathAnalysis,
      nodes,
      edges,
      lastSaved,
    },
    ref,
  ) => (
    <div className='epic-header-dropdown-menu' ref={ref}>
      {plubotId && (
        <div className='epic-header-dropdown-item'>
          <History size={16} className='epic-header-dropdown-icon' />
          <span>Copias de seguridad</span>
          <div className='epic-header-dropdown-action'>
            <BackupManager plubotId={plubotId} />
          </div>
        </div>
      )}

      {/* Historial de versiones */}
      <div
        className='epic-header-dropdown-item clickable'
        role='button'
        tabIndex={0}
        onClick={onOpenVersionHistory}
        onKeyDown={(event) => _handleKeyDown(event, onOpenVersionHistory)}
      >
        <History size={16} className='epic-header-dropdown-icon' />
        <span>Historial de versiones</span>
      </div>

      {/* Importar / Exportar */}
      <div
        className='epic-header-dropdown-item clickable'
        role='button'
        tabIndex={0}
        onClick={onOpenImportExport}
        onKeyDown={(event) => _handleKeyDown(event, onOpenImportExport)}
      >
        <Database size={16} className='epic-header-dropdown-icon' />
        <span>Importar / Exportar</span>
      </div>

      {_renderPerformanceStatsSection({ nodes, edges, lastSaved })}

      <div
        className='epic-header-dropdown-item clickable'
        role='button'
        tabIndex={0}
        onClick={onOpenSettingsModal}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            onOpenSettingsModal();
          }
        }}
      >
        <Settings size={16} className='epic-header-dropdown-icon' />
        <span>Configuración del flujo</span>
      </div>

      <div
        className='epic-header-dropdown-item clickable'
        role='button'
        tabIndex={0}
        onClick={onOpenPathAnalysis}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            onOpenPathAnalysis();
          }
        }}
      >
        <Database size={16} className='epic-header-dropdown-icon' />
        <span>Análisis de rutas</span>
      </div>
    </div>
  ),
);

OptionsMenu.displayName = 'OptionsMenu';

OptionsMenu.propTypes = {
  plubotId: PropTypes.string,
  onOpenVersionHistory: PropTypes.func.isRequired,
  onOpenImportExport: PropTypes.func.isRequired,
  onOpenSettingsModal: PropTypes.func.isRequired,
  onOpenPathAnalysis: PropTypes.func.isRequired,
  nodes: PropTypes.array.isRequired,
  edges: PropTypes.array.isRequired,
  lastSaved: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};

OptionsMenu.defaultProps = {
  plubotId: undefined,
  lastSaved: undefined,
};

export default React.memo(OptionsMenu);

/**
 * Button components for OptionsMenu
 */
import { Shield, History, Database, BarChart2, Settings } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

const buttonStyle = {
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
};

const handleMouseEnter = (event) => {
  event.currentTarget.style.background = 'rgba(0, 195, 255, 0.1)';
};

const handleMouseLeave = (event) => {
  event.currentTarget.style.background = 'transparent';
};

export const BackupButton = ({ onClick }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    onMouseDown={(event) => event.stopPropagation()}
    title='Crear y gestionar copias de seguridad del flujo'
    style={buttonStyle}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
  >
    <Shield size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
    <span>Gestor de Backups</span>
  </button>
);

BackupButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export const VersionHistoryButton = ({ onClick }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    title='Ver y restaurar versiones anteriores del flujo'
    style={buttonStyle}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
  >
    <History size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
    <span>Historial de versiones</span>
  </button>
);

VersionHistoryButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export const ImportExportButton = ({ onClick }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    title='Importar flujos desde archivo o exportar el flujo actual'
    style={buttonStyle}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
  >
    <Database size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
    <span>Importar / Exportar</span>
  </button>
);

ImportExportButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export const SettingsButton = ({ onClick, showCopyNotification }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    title='Configurar opciones y parámetros del flujo'
    style={buttonStyle}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
  >
    <Settings size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
    <span>Configuración del flujo</span>
    {showCopyNotification && (
      <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#00c3ff' }}>ID copiado!</span>
    )}
  </button>
);

SettingsButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  showCopyNotification: PropTypes.bool,
};

export const PathAnalysisButton = ({ onClick }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    title='Analizar las rutas y caminos posibles en el flujo'
    style={buttonStyle}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
  >
    <BarChart2 size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
    <span>Análisis de rutas</span>
  </button>
);

PathAnalysisButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

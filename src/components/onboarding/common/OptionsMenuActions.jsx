/**
 * Action button components for OptionsMenu
 */
import { Copy, Download, Trash2, Layers, GitBranch } from 'lucide-react';
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

export const ExportFlowButton = ({ onClick }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={onClick}
    title='Exportar el flujo actual como archivo JSON'
    style={buttonStyle}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
  >
    <Download size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
    <span>Exportar flujo</span>
  </button>
);

ExportFlowButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export const ClearFlowButton = ({ onClick }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={onClick}
    title='Limpiar todos los nodos y conexiones del flujo'
    style={buttonStyle}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
  >
    <Trash2 size={16} className='epic-header-dropdown-icon' style={{ color: '#ff4444' }} />
    <span>Limpiar flujo</span>
  </button>
);

ClearFlowButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export const DuplicateNodesButton = ({ onClick }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={onClick}
    title='Duplicar los nodos seleccionados'
    style={buttonStyle}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
  >
    <Layers size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
    <span>Duplicar nodos</span>
  </button>
);

DuplicateNodesButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export const CopyFlowIdButton = ({ onClick, showNotification }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={onClick}
    title='Copiar el ID del flujo al portapapeles'
    style={buttonStyle}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
  >
    <Copy size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
    <span>Copiar ID del flujo</span>
    {showNotification && (
      <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#00c3ff' }}>¡Copiado!</span>
    )}
  </button>
);

CopyFlowIdButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  showNotification: PropTypes.bool,
};

export const ShowComplexityButton = ({ onClick }) => (
  <button
    className='epic-header-dropdown-item clickable'
    type='button'
    onClick={onClick}
    title='Ver la complejidad del flujo'
    style={buttonStyle}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
  >
    <GitBranch size={16} className='epic-header-dropdown-icon' style={{ color: '#00c3ff' }} />
    <span>Complejidad del flujo</span>
  </button>
);

ShowComplexityButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

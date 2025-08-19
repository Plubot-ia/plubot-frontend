import { Download, Trash2, Shield, RefreshCw, Copy } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

// Menu item base style
const menuItemStyle = {
  width: '100%',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  padding: '10px 16px',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontSize: '14px',
  fontFamily: 'inherit',
};

// Helper functions
const getFlowComplexity = (nodes) => {
  const nodeCount = nodes?.length || 0;
  if (nodeCount === 0) return 'Vacío';
  if (nodeCount < 5) return 'Simple';
  if (nodeCount < 15) return 'Moderado';
  if (nodeCount < 30) return 'Complejo';
  return 'Muy complejo';
};

const getEstimatedMemory = (nodes, edges) => {
  const nodeCount = nodes?.length || 0;
  const edgeCount = edges?.length || 0;
  const bytes = nodeCount * 2048 + edgeCount * 512;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(2)} MB`;
};

// Menu action components
export const BackupManagerButton = ({ onAction, onClose }) => (
  <button
    className='menu-item primary'
    onClick={() => {
      onAction();
      if (typeof onClose === 'function') onClose();
    }}
    style={menuItemStyle}
  >
    <Shield size={16} style={{ color: '#00c3ff' }} />
    <span>Gestor de Backups</span>
  </button>
);

BackupManagerButton.propTypes = {
  onAction: PropTypes.func.isRequired,
  onClose: PropTypes.func,
};

export const ExportFlowButton = ({ onExport }) => (
  <button className='menu-item' onClick={onExport} style={menuItemStyle}>
    <Download size={16} style={{ color: '#00c3ff' }} />
    <span>Exportar Flujo</span>
  </button>
);

ExportFlowButton.propTypes = {
  onExport: PropTypes.func.isRequired,
};

export const DuplicateNodesButton = ({ hasSelection, onDuplicate }) => (
  <button
    className='menu-item'
    onClick={onDuplicate}
    disabled={!hasSelection}
    style={{
      ...menuItemStyle,
      opacity: hasSelection ? 1 : 0.5,
      cursor: hasSelection ? 'pointer' : 'not-allowed',
    }}
  >
    <Copy size={16} style={{ color: '#00c3ff' }} />
    <span>Duplicar Selección</span>
  </button>
);

DuplicateNodesButton.propTypes = {
  hasSelection: PropTypes.bool.isRequired,
  onDuplicate: PropTypes.func.isRequired,
};

export const RefreshFlowButton = ({ onRefresh }) => (
  <button className='menu-item' onClick={onRefresh} style={menuItemStyle}>
    <RefreshCw size={16} style={{ color: '#00c3ff' }} />
    <span>Recargar desde Servidor</span>
  </button>
);

RefreshFlowButton.propTypes = {
  onRefresh: PropTypes.func.isRequired,
};

export const ClearFlowButton = ({ onClear }) => (
  <button
    className='menu-item danger'
    onClick={onClear}
    style={{
      ...menuItemStyle,
      color: '#ff4444',
    }}
  >
    <Trash2 size={16} style={{ color: '#ff4444' }} />
    <span>Limpiar Todo</span>
  </button>
);

ClearFlowButton.propTypes = {
  onClear: PropTypes.func.isRequired,
};

// Flow info section component
export const FlowInfoSection = ({
  plubotId,
  nodes,
  edges,
  lastSaved,
  onCopyId,
  showCopyNotification,
}) => (
  <div style={{ padding: '12px 16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      <span style={{ fontWeight: 500, fontSize: '14px', color: '#00c3ff' }}>
        ℹ️ Información del Flujo
      </span>
    </div>

    <div style={{ fontSize: '12px', lineHeight: '1.8', marginLeft: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>ID del Flujo:</span>
        <button
          onClick={onCopyId}
          style={{
            background: 'none',
            border: 'none',
            color: '#00c3ff',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'monospace',
            padding: '2px 6px',
            borderRadius: '4px',
            transition: 'background 0.2s',
          }}
        >
          {plubotId.slice(0, 8)}...
          {showCopyNotification && (
            <span style={{ marginLeft: '8px', color: '#4ade80' }}>✓ Copiado</span>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Nodos:</span>
        <span style={{ color: '#fff' }}>{nodes?.length || 0}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Conexiones:</span>
        <span style={{ color: '#fff' }}>{edges?.length || 0}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Complejidad:</span>
        <span style={{ color: '#fff' }}>{getFlowComplexity(nodes)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Memoria est.:</span>
        <span style={{ color: '#fff' }}>{getEstimatedMemory(nodes, edges)}</span>
      </div>

      {lastSaved && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>Último guardado:</span>
          <span style={{ color: '#fff', fontSize: '11px' }}>
            {new Date(lastSaved).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  </div>
);

FlowInfoSection.propTypes = {
  plubotId: PropTypes.string.isRequired,
  nodes: PropTypes.array,
  edges: PropTypes.array,
  lastSaved: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCopyId: PropTypes.func.isRequired,
  showCopyNotification: PropTypes.bool,
};

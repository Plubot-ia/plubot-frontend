/**
 * Helper components for BackupManager
 */
import { Clock, Save, RotateCcw, Trash2, Download, AlertCircle, CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

// Backup item component
export const BackupItem = ({
  backup,
  isSelected,
  onSelect,
  onRestore,
  onDelete,
  onExport,
  formatTimestamp,
  formatSize,
}) => (
  <div
    className={`backup-item ${isSelected ? 'selected' : ''}`}
    onClick={() => onSelect(backup)}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(backup);
      }
    }}
    role='button'
    tabIndex={0}
    style={{
      padding: '12px',
      background: isSelected ? 'rgba(0, 195, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      marginBottom: '8px',
      cursor: 'pointer',
      border: isSelected ? '1px solid #00c3ff' : '1px solid rgba(255, 255, 255, 0.1)',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          {backup.type === 'auto' ? <Clock size={14} /> : <Save size={14} />}
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {backup.type === 'auto' ? 'Auto-guardado' : 'Manual'}
          </span>
          <span style={{ fontSize: '12px', color: '#999' }}>
            {formatTimestamp(backup.timestamp)}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#ccc' }}>
          {backup.nodeCount} nodos, {backup.edgeCount} conexiones
        </div>
        <div style={{ fontSize: '11px', color: '#999' }}>
          {formatSize(backup.size)} • {backup.reason || 'Sin razón'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          type='button'
          onClick={(event) => {
            event.stopPropagation();
            onRestore(backup);
          }}
          className='backup-action-btn'
          title='Restaurar'
        >
          <RotateCcw size={14} />
        </button>
        <button
          type='button'
          onClick={(event) => {
            event.stopPropagation();
            onExport(backup);
          }}
          className='backup-action-btn'
          title='Exportar'
        >
          <Download size={14} />
        </button>
        <button
          type='button'
          onClick={(event) => {
            event.stopPropagation();
            onDelete(backup);
          }}
          className='backup-action-btn danger'
          title='Eliminar'
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  </div>
);

BackupItem.propTypes = {
  backup: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  formatTimestamp: PropTypes.func.isRequired,
  formatSize: PropTypes.func.isRequired,
};

// Stats card component
export const StatsCard = ({ icon: Icon, label, value, color = '#00c3ff' }) => (
  <div
    style={{
      padding: '12px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      textAlign: 'center',
    }}
  >
    <Icon size={20} style={{ color, marginBottom: '4px' }} />
    <div style={{ fontSize: '18px', fontWeight: 'bold', color }}>{value}</div>
    <div style={{ fontSize: '11px', color: '#999' }}>{label}</div>
  </div>
);

StatsCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string,
};

// Message component
export const Message = ({ message, onDismiss }) => {
  if (!message) return;

  return (
    <div
      className={`backup-message ${message.type}`}
      style={{
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background:
          message.type === 'success' ? 'rgba(68, 255, 68, 0.1)' : 'rgba(255, 68, 68, 0.1)',
        border: `1px solid ${message.type === 'success' ? '#44ff44' : '#ff4444'}`,
      }}
    >
      {message.type === 'success' ? (
        <CheckCircle size={16} style={{ color: '#44ff44' }} />
      ) : (
        <AlertCircle size={16} style={{ color: '#ff4444' }} />
      )}
      <span style={{ flex: 1 }}>{message.text}</span>
      <button
        type='button'
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#999',
          cursor: 'pointer',
        }}
      >
        ×
      </button>
    </div>
  );
};

Message.propTypes = {
  message: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']),
    text: PropTypes.string,
  }),
  onDismiss: PropTypes.func.isRequired,
};

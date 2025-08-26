/**
 * Modal wrapper component for BackupManager
 */
import {
  X,
  Database,
  HardDrive,
  Clock,
  Save,
  Archive,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

// Stats and message components imported inline when needed

// Helper functions moved to outer scope
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Nunca';
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const index = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.max(0, Math.min(index, 3));

  let sizeUnit;
  switch (safeIndex) {
    case 0: {
      sizeUnit = 'B';
      break;
    }
    case 1: {
      sizeUnit = 'KB';
      break;
    }
    case 2: {
      sizeUnit = 'MB';
      break;
    }
    case 3: {
      sizeUnit = 'GB';
      break;
    }
    default: {
      sizeUnit = 'B';
    }
  }

  return `${Math.round(bytes / k ** safeIndex)} ${sizeUnit}`;
};

// Backup Item Component
const BackupItem = ({
  backup,
  selectedBackup,
  setSelectedBackup,
  handleRestore,
  handleDelete,
  formatTimestampProp,
  formatFileSizeProp,
}) => (
  <div
    key={backup.id}
    className={`backup-item compact ${selectedBackup?.id === backup.id ? 'selected' : ''}`}
    onClick={() => setSelectedBackup(backup)}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setSelectedBackup(backup);
      }
    }}
    role='button'
    tabIndex={0}
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      gap: '10px',
      minHeight: 'auto',
    }}
  >
    {backup.type === 'auto' ? (
      <Save size={16} className='backup-icon auto' style={{ flexShrink: 0 }} />
    ) : (
      <Archive size={16} className='backup-icon' style={{ flexShrink: 0 }} />
    )}

    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '1px',
        }}
      >
        <span
          className='backup-name'
          style={{ fontWeight: '600', fontSize: '13px', lineHeight: '1.2' }}
        >
          {backup.name}
        </span>
        <span style={{ fontSize: '11px', color: '#888', lineHeight: '1' }}>
          {formatTimestampProp(backup.timestamp)}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          fontSize: '11px',
          color: '#666',
          lineHeight: '1.2',
        }}
      >
        <span>{formatFileSizeProp(backup.size)}</span>
        {backup.nodeCount !== undefined && <span>{backup.nodeCount} nodos</span>}
        {backup.edgeCount !== undefined && <span>{backup.edgeCount} conexiones</span>}
        {backup.type === 'auto' && <span style={{ fontSize: '10px', color: '#999' }}>• Auto</span>}
      </div>
    </div>

    <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
      <button
        className='backup-action-btn restore'
        onClick={(event) => {
          event.stopPropagation();
          handleRestore(backup);
        }}
        title='Restaurar backup'
        type='button'
        style={{ padding: '4px', fontSize: '12px' }}
      >
        <RotateCcw size={14} />
      </button>
      <button
        className='backup-action-btn delete'
        onClick={(event) => {
          event.stopPropagation();
          handleDelete(backup.id);
        }}
        title='Eliminar backup'
        type='button'
        style={{ padding: '4px', fontSize: '12px' }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  </div>
);

BackupItem.propTypes = {
  backup: PropTypes.object.isRequired,
  selectedBackup: PropTypes.object,
  setSelectedBackup: PropTypes.func.isRequired,
  handleRestore: PropTypes.func.isRequired,
  handleDelete: PropTypes.func.isRequired,
  formatTimestampProp: PropTypes.func.isRequired,
  formatFileSizeProp: PropTypes.func.isRequired,
};

export const BackupManagerModal = ({
  backups,
  stats,
  message,
  selectedBackup,
  setSelectedBackup,
  handleRestore,
  handleDelete,
  _handleExport,
  _handleImport,
  _handleCreate,
  onClose,
}) => {
  return (
    <div className='backup-manager-overlay'>
      <div className='backup-manager-modal'>
        <div className='backup-header'>
          <h2> Historial de Backups</h2>
          <button type='button' onClick={onClose} className='close-button' aria-label='Cerrar'>
            <X size={20} />
          </button>
        </div>

        <div className='backup-stats'>
          <div className='stat-card'>
            <Database className='stat-icon' size={16} />
            <div className='stat-content'>
              <div className='stat-value'>{stats.totalBackups || 0}</div>
              <div className='stat-label'>Copias</div>
            </div>
          </div>
          <div className='stat-card'>
            <HardDrive className='stat-icon' size={16} />
            <div className='stat-content'>
              <div className='stat-value'>{formatFileSize(stats.totalSize)}</div>
              <div className='stat-label'>Tamaño</div>
            </div>
          </div>
          <div className='stat-card'>
            <Clock className='stat-icon' size={16} />
            <div className='stat-content'>
              <div className='stat-value'>{formatTimestamp(stats.lastBackup)}</div>
              <div className='stat-label'>Última</div>
            </div>
          </div>
        </div>

        {/* Botones eliminados para simplificar la UI - los backups se crean automáticamente al guardar */}

        {message && (
          <div className={`backup-message ${message.type || ''}`}>
            {(() => {
              if (message.type === 'error') return <AlertCircle size={16} />;
              if (message.type === 'info') return <Info size={16} />;
              return <CheckCircle size={16} />;
            })()}
            <span>{message.text || message}</span>
          </div>
        )}

        <div className='backup-list'>
          {backups.length === 0 ? (
            <div className='backup-empty'>
              <Archive size={48} className='empty-icon' />
              <p className='empty-text'>No hay copias de seguridad</p>
              <p className='empty-hint'>Los backups se crean automáticamente al guardar el flujo</p>
            </div>
          ) : (
            backups.map((backup) => (
              <BackupItem
                key={backup.id}
                backup={backup}
                selectedBackup={selectedBackup}
                setSelectedBackup={setSelectedBackup}
                handleRestore={handleRestore}
                handleDelete={handleDelete}
                formatTimestampProp={formatTimestamp}
                formatFileSizeProp={formatFileSize}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

BackupManagerModal.propTypes = {
  backups: PropTypes.array.isRequired,
  stats: PropTypes.object.isRequired,
  message: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      type: PropTypes.string,
      text: PropTypes.string,
    }),
  ]),
  selectedBackup: PropTypes.object,
  setSelectedBackup: PropTypes.func.isRequired,
  handleRestore: PropTypes.func.isRequired,
  handleDelete: PropTypes.func.isRequired,
  _handleExport: PropTypes.func,
  _handleImport: PropTypes.func,
  _handleCreate: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

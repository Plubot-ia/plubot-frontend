/**
 * Modal wrapper component for BackupManager
 */
import {
  X,
  Database,
  HardDrive,
  Clock,
  Save,
  Download,
  Upload,
  Archive,
  Trash2,
  RotateCcw,
  Plus,
  AlertCircle,
  CheckCircle,
  Info,
  FolderOpen,
} from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

import { BackupItem, StatsCard, Message } from './BackupManagerHelpers.jsx';

export const BackupManagerModal = ({
  backups,
  stats,
  message,
  selectedBackup,
  setSelectedBackup,
  handleRestore,
  handleDelete,
  handleExport,
  handleImport,
  handleCreate,
  onClose,
}) => {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);

    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className='backup-manager-overlay'>
      <div className='backup-manager-modal'>
        <div className='backup-header'>
          <h2>💾 Historial de Backups</h2>
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
            {message.type === 'error' ? (
              <AlertCircle size={16} />
            ) : message.type === 'info' ? (
              <Info size={16} />
            ) : (
              <CheckCircle size={16} />
            )}
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
              <div
                key={backup.id}
                className={`backup-item compact ${selectedBackup?.id === backup.id ? 'selected' : ''}`}
                onClick={() => setSelectedBackup(backup)}
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
                      {formatTimestamp(backup.timestamp)}
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
                    <span>{formatFileSize(backup.size)}</span>
                    {backup.nodeCount !== undefined && <span>{backup.nodeCount} nodos</span>}
                    {backup.edgeCount !== undefined && <span>{backup.edgeCount} conexiones</span>}
                    {backup.type === 'auto' && (
                      <span style={{ fontSize: '10px', color: '#999' }}>• Auto</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                  <button
                    className='backup-action-btn restore'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(backup);
                    }}
                    title='Restaurar este backup'
                    style={{ padding: '5px', borderRadius: '4px' }}
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    className='backup-action-btn delete'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(backup.id);
                    }}
                    title='Eliminar'
                    style={{ padding: '5px', borderRadius: '4px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {backup.reason && (
                  <div className='backup-reason' style={{ display: 'none' }}>
                    <Info size={12} />
                    <span>{backup.reason}</span>
                  </div>
                )}
              </div>
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
  handleExport: PropTypes.func.isRequired,
  handleImport: PropTypes.func.isRequired,
  handleCreate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

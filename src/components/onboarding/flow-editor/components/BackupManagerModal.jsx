/**
 * Modal wrapper component for BackupManager
 */
import { X, Database, HardDrive, Clock, Save, Download, Upload, Archive, Trash2, RotateCcw, Plus, AlertCircle, CheckCircle, Info, FolderOpen } from 'lucide-react';
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
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

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
          <h2>Gestor de Copias de Seguridad</h2>
          <button type='button' onClick={onClose} className='close-button' aria-label='Cerrar'>
            <X size={20} />
          </button>
        </div>

        <div className="backup-stats">
          <div className="stat-card">
            <Database className="stat-icon" size={16} />
            <div className="stat-content">
              <div className="stat-value">{stats.totalBackups || 0}</div>
              <div className="stat-label">Copias</div>
            </div>
          </div>
          <div className="stat-card">
            <HardDrive className="stat-icon" size={16} />
            <div className="stat-content">
              <div className="stat-value">{formatFileSize(stats.totalSize)}</div>
              <div className="stat-label">Tamaño</div>
            </div>
          </div>
          <div className="stat-card">
            <Clock className="stat-icon" size={16} />
            <div className="stat-content">
              <div className="stat-value">{formatTimestamp(stats.lastBackup)}</div>
              <div className="stat-label">Última</div>
            </div>
          </div>
        </div>

        <div className='backup-actions'>
          <button type='button' onClick={handleCreate} className='action-button primary'>
            <Save size={16} />
            <span>Nueva Copia</span>
          </button>
          <button type='button' onClick={handleImport} className='action-button'>
            <Upload size={16} />
            <span>Importar</span>
          </button>
          <button
            type='button'
            onClick={handleExport}
            className='action-button'
            disabled={!selectedBackup}
          >
            <Download size={16} />
            <span>Exportar</span>
          </button>
        </div>

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

        <div className="backup-list">
          {backups.length === 0 ? (
            <div className="backup-empty">
              <Archive size={48} className="empty-icon" />
              <p className="empty-text">No hay copias de seguridad</p>
              <p className="empty-hint">Crea tu primera copia para proteger tu trabajo</p>
            </div>
          ) : (
            backups.map((backup) => (
              <div
                key={backup.id}
                className={`backup-item ${selectedBackup?.id === backup.id ? 'selected' : ''}`}
                onClick={() => setSelectedBackup(backup)}
              >
                <div className="backup-item-header">
                  {backup.type === 'auto' ? (
                    <Save size={18} className="backup-icon auto" />
                  ) : (
                    <Archive size={18} className="backup-icon" />
                  )}
                  <span className="backup-name">{backup.name}</span>
                  <span className="backup-time">{formatTimestamp(backup.timestamp)}</span>
                </div>
                <div className="backup-item-details">
                  <div className="backup-meta">
                    <span className="backup-size">{formatFileSize(backup.size)}</span>
                    {backup.nodeCount !== undefined && (
                      <span className="backup-nodes">{backup.nodeCount} nodos</span>
                    )}
                    {backup.edgeCount !== undefined && (
                      <span className="backup-edges">{backup.edgeCount} conexiones</span>
                    )}
                  </div>
                  <div className="backup-actions">
                    <button
                      className="backup-action-btn restore"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(backup);
                      }}
                      title="Restaurar"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      className="backup-action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(backup.id);
                      }}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {backup.reason && (
                  <div className="backup-reason">
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
      text: PropTypes.string
    })
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

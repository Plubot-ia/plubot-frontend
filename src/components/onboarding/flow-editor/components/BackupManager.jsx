/**
 * BackupManager Component
 *
 * Professional UI for managing flow backups with manual control.
 * Provides visibility and control over the backup system.
 */

import {
  Clock,
  Save,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Archive,
  Shield,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import useFlowStore from '@/stores/use-flow-store';

import { getBackupManager } from '../utils/flow-backup-manager';

import './BackupManager.css';

const BackupManager = ({ isOpen, onClose }) => {
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedBackup, setSelectedBackup] = useState(null);

  const plubotId = useFlowStore((state) => state.plubotId);
  const backupManager = getBackupManager();

  // Load backups and stats
  const loadBackups = useCallback(() => {
    if (!backupManager.isInitialized) {
      backupManager.initialize(plubotId);
    }

    // Get all backups from the manager
    const allBackups = [...backupManager.backups.entries()]
      .map(([id, backup]) => ({
        id,
        ...backup.metadata,
        size: backup.data.length,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    setBackups(allBackups);
    setStats(backupManager.getStats());
  }, [backupManager, plubotId]);

  useEffect(() => {
    if (isOpen) {
      loadBackups();
    }
  }, [isOpen, loadBackups]);

  // Create manual backup
  const handleCreateBackup = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const backupId = backupManager.createBackup({
        forceSave: true,
        userAction: 'manual',
        reason: 'user_manual_backup',
      });

      if (backupId) {
        setMessage({
          type: 'success',
          text: 'Backup creado exitosamente',
        });
        loadBackups();
      } else {
        setMessage({
          type: 'warning',
          text: 'No se creó el backup (sin cambios significativos)',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error al crear backup: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Restore backup
  const handleRestoreBackup = async (backupId) => {
    if (
      !globalThis.confirm(
        '¿Estás seguro de que deseas restaurar este backup? Se perderán los cambios actuales.',
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const success = backupManager.restoreBackup(backupId);

      if (success) {
        setMessage({
          type: 'success',
          text: 'Backup restaurado exitosamente',
        });
        // Close modal after successful restore
        setTimeout(() => onClose(), 1500);
      } else {
        setMessage({
          type: 'error',
          text: 'Error al restaurar el backup',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error al restaurar: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete backup
  const handleDeleteBackup = (backupId) => {
    if (!globalThis.confirm('¿Estás seguro de que deseas eliminar este backup?')) {
      return;
    }

    try {
      backupManager.backups.delete(backupId);
      const storageKey = `flow_backup_${plubotId}_${backupId}`;
      localStorage.removeItem(storageKey);

      setMessage({
        type: 'success',
        text: 'Backup eliminado',
      });
      loadBackups();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error al eliminar: ${error.message}`,
      });
    }
  };

  // Export backup
  const handleExportBackup = (backupId) => {
    const backup = backupManager.backups.get(backupId);
    if (!backup) return;

    const exportData = {
      version: '2.0',
      plubotId,
      backup: {
        metadata: backup.metadata,
        data: backup.data,
      },
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plubot-backup-${plubotId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setMessage({
      type: 'success',
      text: 'Backup exportado',
    });
  };

  // Import backup
  const handleImportBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', (e) => {
      try {
        const importData = JSON.parse(e.target.result);

        if (importData.version !== '2.0' || !importData.backup) {
          throw new Error('Formato de backup inválido');
        }

        // Add imported backup to manager
        const backupId = `imported_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        backupManager.backups.set(backupId, importData.backup);

        setMessage({
          type: 'success',
          text: 'Backup importado exitosamente',
        });
        loadBackups();
      } catch (error) {
        setMessage({
          type: 'error',
          text: `Error al importar: ${error.message}`,
        });
      }
    });
    reader.readAsText(file);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60_000) return 'Hace un momento';
    if (diff < 3_600_000) return `Hace ${Math.floor(diff / 60_000)} minutos`;
    if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000)} horas`;

    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(2)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className='backup-manager-overlay'>
      <div className='backup-manager-modal'>
        <div className='backup-manager-header'>
          <div className='header-title'>
            <Shield className='header-icon' />
            <h2>Gestor de Backups</h2>
          </div>
          <button className='close-button' onClick={onClose}>
            ×
          </button>
        </div>

        {message && (
          <div className={`message message-${message.type}`}>
            {message.type === 'success' && <CheckCircle size={16} />}
            {message.type === 'error' && <AlertCircle size={16} />}
            {message.type === 'warning' && <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className='backup-manager-actions'>
          <button className='action-button primary' onClick={handleCreateBackup} disabled={loading}>
            <Save size={16} />
            Crear Backup Manual
          </button>

          <label className='action-button secondary'>
            <Upload size={16} />
            Importar Backup
            <input
              type='file'
              accept='.json'
              onChange={handleImportBackup}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {stats && (
          <div className='backup-stats'>
            <div className='stat'>
              <Archive size={14} />
              <span>{stats.totalBackups} backups</span>
            </div>
            <div className='stat'>
              <Clock size={14} />
              <span>Último: {formatTimestamp(stats.newestBackup)}</span>
            </div>
            <div className='stat'>
              <Save size={14} />
              <span>Total: {formatSize(stats.totalSize)}</span>
            </div>
          </div>
        )}

        <div className='backup-list'>
          {backups.length === 0 ? (
            <div className='empty-state'>
              <Archive size={48} />
              <p>No hay backups disponibles</p>
              <small>Crea un backup manual o espera al backup automático</small>
            </div>
          ) : (
            backups.map((backup) => (
              <div
                key={backup.id}
                className={`backup-item ${selectedBackup === backup.id ? 'selected' : ''}`}
                onClick={() => setSelectedBackup(backup.id === selectedBackup ? null : backup.id)}
              >
                <div className='backup-info'>
                  <div className='backup-main'>
                    <span className='backup-time'>
                      <Clock size={14} />
                      {formatTimestamp(backup.timestamp)}
                    </span>
                    <span className='backup-details'>
                      {backup.nodeCount} nodos, {backup.edgeCount} conexiones
                    </span>
                  </div>
                  <div className='backup-meta'>
                    <span className='backup-version'>v{backup.version}</span>
                    <span className='backup-size'>{formatSize(backup.size)}</span>
                    {backup.userAction && <span className='backup-tag'>{backup.userAction}</span>}
                  </div>
                </div>

                {selectedBackup === backup.id && (
                  <div className='backup-actions'>
                    <button
                      className='backup-action restore'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreBackup(backup.id);
                      }}
                      disabled={loading}
                    >
                      <RotateCcw size={14} />
                      Restaurar
                    </button>
                    <button
                      className='backup-action export'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportBackup(backup.id);
                      }}
                    >
                      <Download size={14} />
                      Exportar
                    </button>
                    <button
                      className='backup-action delete'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBackup(backup.id);
                      }}
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className='backup-manager-footer'>
          <small className='footer-info'>
            Los backups se crean automáticamente cada 30 segundos cuando hay cambios significativos.
            Los backups antiguos se eliminan automáticamente después de 24 horas.
          </small>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;

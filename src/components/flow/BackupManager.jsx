import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { History, X, RotateCcw, Info } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import useFlowStore from '@/stores/use-flow-store';
import './BackupManager.css';

/**
 * Formatear la fecha para mostrarla de forma relativa.
 * @param {string} dateString - La fecha en formato string.
 * @returns {string} - La fecha formateada.
 */
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch {
    return 'Fecha desconocida';
  }
};

/**
 * Componente para gestionar las copias de seguridad de los flujos.
 * Permite listar, visualizar y restaurar copias de seguridad.
 */
const BackupManager = ({ plubotId }) => {
  const [open, setOpen] = useState(false);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState();
  const [error, setError] = useState();

  // Obtener funciones del store
  const listBackups = useFlowStore((state) => state.listBackups);
  const restoreBackup = useFlowStore((state) => state.restoreBackup);
  const setPlubotId = useFlowStore((state) => state.setPlubotId);

  // Establecer el ID del plubot en el store cuando cambie
  useEffect(() => {
    if (plubotId) {
      setPlubotId(plubotId);
    }
  }, [plubotId, setPlubotId]);

  // Cerrar el diálogo
  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedBackup();
    setError();
  }, []);

  // Manejar cierre con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (open && event.key === 'Escape') {
        handleClose();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleClose]);

  // Cargar la lista de copias de seguridad
  const loadBackups = async () => {
    if (!plubotId) {
      setError('No se ha especificado un ID de plubot válido');
      return;
    }

    setLoading(true);
    setError();

    try {
      const backupList = await listBackups();
      setBackups(backupList || []);
    } catch (error_) {
      setError(
        `No se pudieron cargar las copias de seguridad: ${
          error_.message || 'Error desconocido'
        }`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Cargar las copias de seguridad al abrir el diálogo
  const handleOpen = () => {
    setOpen(true);
    loadBackups();
  };

  // Restaurar una copia de seguridad
  const handleRestore = async (backupId) => {
    if (!plubotId || !backupId) {
      setError('No se puede restaurar: Información incompleta');
      return;
    }

    setRestoring(true);
    setError();

    try {
      const result = await restoreBackup(backupId);

      if (result.success) {
        // Cerrar el diálogo después de restaurar exitosamente
        handleClose();
      } else {
        setError(
          `Error al restaurar: ${result.message || 'Error desconocido'}`,
        );
      }
    } catch (error_) {
      setError(`Error al restaurar: ${error_.message || 'Error desconocido'}`);
    } finally {
      setRestoring(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className='backup-manager-loading'>
          <div className='backup-manager-spinner' />
        </div>
      );
    }

    if (error) {
      return (
        <div className='backup-manager-error'>
          <Info size={18} />
          <p>{error}</p>
        </div>
      );
    }

    if (backups.length === 0) {
      return (
        <div className='backup-manager-empty'>
          <p>No hay copias de seguridad disponibles</p>
        </div>
      );
    }

    return (
      <div className='backup-manager-list'>
        {backups.map((backup) => (
          <div
            key={backup.id}
            className={`backup-manager-item ${
              selectedBackup?.id === backup.id ? 'selected' : ''
            }`}
            onClick={() => setSelectedBackup(backup)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                setSelectedBackup(backup);
              }
            }}
            role='button'
            tabIndex={0}
          >
            <div className='backup-manager-item-content'>
              <h4>{backup.name || `Copia #${backup.id}`}</h4>
              <p className='backup-manager-item-date'>
                Creada {formatDate(backup.created_at)}
              </p>
              {backup.metadata && (
                <p className='backup-manager-item-meta'>
                  {backup.metadata.nodes_count || 0} nodos ·{' '}
                  {backup.metadata.edges_count || 0} conexiones
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div
        className='backup-manager-trigger'
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            handleOpen();
          }
        }}
        role='button'
        tabIndex={0}
        title='Gestionar copias de seguridad'
      >
        <History size={16} />
      </div>

      {open && (
        <div className='backup-manager-overlay'>
          <div
            className='backup-manager-dialog'
            role='dialog'
            aria-modal='true'
            aria-labelledby='backup-manager-dialog-title'
            tabIndex={-1}
          >
            <div className='backup-manager-header'>
              <div className='backup-manager-title'>
                <History size={18} />
                <h3 id='backup-manager-dialog-title'>Copias de seguridad</h3>
              </div>
              <button
                className='backup-manager-close-btn'
                onClick={handleClose}
              >
                <X size={18} />
              </button>
            </div>

            <div className='backup-manager-divider' />

            <div className='backup-manager-content'>{renderContent()}</div>

            <div className='backup-manager-divider' />

            <div className='backup-manager-actions'>
              <button
                className='backup-manager-cancel-btn'
                onClick={handleClose}
              >
                Cancelar
              </button>
              <button
                className='backup-manager-restore-btn'
                onClick={() => handleRestore(selectedBackup?.id)}
                disabled={!selectedBackup || restoring}
              >
                {restoring ? (
                  <>
                    <div className='backup-manager-spinner-small' />
                    <span>Restaurando...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    <span>Restaurar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

BackupManager.propTypes = {
  plubotId: PropTypes.string.isRequired,
};

export default BackupManager;

import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import './SyncModal.css';
// Importar el contexto global
import useByteMessageContext from '../../../hooks/useByteMessageContext';
import useModalContext from '../../../hooks/useModalContext';

// Helper: Renderizar estado pendiente
const renderPendingState = ({ lastSyncTime, handleSync, onCloseModal }) => (
  <>
    <div className='sync-modal-info'>
      <p>Al sincronizar tu flujo de conversación:</p>
      <ul>
        <li>Se guardarán todos los cambios realizados</li>
        <li>Se creará un respaldo local en tu navegador</li>
        <li>Se protegerá tu trabajo contra pérdidas accidentales</li>
      </ul>

      {lastSyncTime && (
        <p className='sync-last-time'>Última sincronización: {lastSyncTime.toLocaleString()}</p>
      )}
    </div>

    <div className='sync-modal-actions'>
      <button className='sync-button primary' onClick={handleSync}>
        Sincronizar Ahora
      </button>
      <button className='sync-button secondary' onClick={onCloseModal}>
        Cancelar
      </button>
    </div>
  </>
);

// Helper: Renderizar estado de sincronización
const renderSyncingState = ({ syncMessage, syncProgress }) => (
  <div className='sync-progress-container'>
    <div className='sync-progress-animation'>
      <div className='sync-circle' />
      <div className='sync-pulse' />
    </div>
    <p className='sync-message'>{syncMessage}</p>
    <div className='sync-progress-bar'>
      <div className='sync-progress-fill' style={{ width: `${syncProgress}%` }} />
    </div>
  </div>
);

// Helper: Renderizar estado de éxito
const renderSuccessState = ({ syncMessage }) => (
  <div className='sync-result success'>
    <div className='sync-success-icon'>✓</div>
    <p>{syncMessage}</p>
  </div>
);

// Helper: Renderizar estado de error
const renderErrorState = ({ syncMessage, handleSync, onClose }) => (
  <div className='sync-result error'>
    <div className='sync-error-icon'>!</div>
    <p>{syncMessage}</p>
    <button className='sync-button primary' onClick={handleSync}>
      Reintentar
    </button>
    <button className='sync-button secondary' onClick={onClose}>
      Cerrar
    </button>
  </div>
);

// Helper: Crear función de notificación
const createNotifyFunction = (setSyncMessage, showNotification) => {
  return (message, type = 'info') => {
    // 1. Actualizar el estado local del modal
    setSyncMessage(message);

    // 2. Usar el sistema global de notificaciones solo una vez (evitar duplicados)
    // Solo mostrar notificación para errores o la notificación final de éxito
    if (type === 'error' || message === 'Sincronización completada') {
      // Limpiar notificaciones anteriores para evitar acumulación
      if (typeof globalThis.clearAllNotifications === 'function') {
        globalThis.clearAllNotifications();
      }

      showNotification(message, type, type === 'success' ? 2000 : 3000);
    }

    // 3. No usamos más onNotify para evitar duplicados
  };
};

// Helper: Crear función de cierre modal
const createCloseModalFunction = (closeModal, onClose) => {
  return () => {
    // Limpiar notificaciones al cerrar
    if (typeof globalThis.clearAllNotifications === 'function') {
      globalThis.clearAllNotifications();
    }

    // Cerrar modal usando el mecanismo disponible
    if (closeModal) {
      closeModal('syncModal');
    } else if (typeof onClose === 'function') {
      onClose();
    }
  };
};

/**
 * Modal para sincronizar y respaldar los cambios del editor de flujos
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onSync - Función para sincronizar y guardar cambios
 * @param {Object} props.project - Información del proyecto actual
 * @param {Function} props.onNotify - Función para notificar eventos (opcional)
 */
const SyncModal = ({ onClose, onSync, project, _onNotify }) => {
  // Usar el contexto global para acceder a las funciones de notificación
  const { showNotification } = useByteMessageContext();
  const { closeModal } = useModalContext();

  const [syncStatus, setSyncStatus] = useState('pending');
  const [lastSyncTime, setLastSyncTime] = useState();
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('Preparando sincronización...');

  // Obtener la fecha y hora de la última sincronización
  useEffect(() => {
    // Intentar obtener la última sincronización del localStorage
    const lastSync = localStorage.getItem(`plubot-last-sync-${project?.id}`);
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }
  }, [project]);

  // Crear funciones helper
  const notify = createNotifyFunction(setSyncMessage, showNotification);
  const onCloseModal = createCloseModalFunction(closeModal, onClose);

  /**
   * Función mejorada que maneja el proceso de sincronización
   * Usando un sistema robusto de notificaciones con múltiples capas de fallback
   */
  const handleSync = async () => {
    try {
      setSyncStatus('syncing');
      setSyncProgress(0);
      setSyncMessage('Iniciando sincronización...');

      // Limpiar todas las notificaciones existentes antes de comenzar
      if (typeof globalThis.clearAllNotifications === 'function') {
        globalThis.clearAllNotifications();
      }

      // Simular progreso de sincronización sin generar notificaciones para cada paso
      let progress = 0;
      let stepCount = 0;
      const interval = setInterval(() => {
        // Sistema determinístico para progreso: más predecible, testeable y suave
        stepCount++;
        const increment = Math.min(15, 12 + (stepCount % 6)); // 12-17 incremento determinístico
        progress += increment;
        if (progress > 100) progress = 100;
        setSyncProgress(Math.floor(progress));

        // Actualizar mensaje según el progreso (solo en el modal, sin notificaciones)
        if (progress < 30) {
          setSyncMessage('Preparando datos para sincronizar...');
        } else if (progress < 60) {
          setSyncMessage('Enviando datos al servidor...');
        } else if (progress < 90) {
          setSyncMessage('Verificando integridad...');
        } else {
          setSyncMessage('Finalizando sincronización...');
        }

        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 500);

      // Intentar guardar realmente los cambios
      try {
        // IMPORTANTE: Wrap la llamada a onSync en un bloque try-catch separado
        // para capturar cualquier error específico en esta operación
        onSync();

        // Simular finalización
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Registrar la fecha y hora de sincronización
        const now = new Date();
        localStorage.setItem(`plubot-last-sync-${project?.id}`, now.toISOString());
        setLastSyncTime(now);
        // Actualizar estado
        setSyncStatus('success');

        // Limpiar notificaciones anteriores para evitar acumulación
        if (typeof globalThis.clearAllNotifications === 'function') {
          globalThis.clearAllNotifications();
        }

        // Solo mostrar una notificación final de éxito
        showNotification('Sincronización completada', 'success', 2000);
        setSyncMessage('Sincronización completada');

        // Guardar fecha de última sincronización
        const syncTime = new Date(); // Usar un nombre diferente para evitar duplicación
        setLastSyncTime(syncTime);
        localStorage.setItem(`plubot-last-sync-${project?.id}`, syncTime.toISOString());

        // No cerramos automáticamente el modal para evitar confusión al usuario
        // Forzar la notificación de éxito solo al final
        notify('Sincronización completada', 'success');
      } catch (saveError) {
        throw new Error(`Error al guardar: ${saveError.message || 'Error desconocido'}`);
      }
    } catch (error) {
      setSyncStatus('error');
      notify(`Error al sincronizar: ${error.message || 'Error desconocido'}`, 'error');
    }
  };

  return (
    <div className='sync-modal-overlay'>
      <div className='sync-modal'>
        <div className='sync-modal-header'>
          <h2>{project?.name || 'Editor de Flujos'} - Sincronización</h2>
          <button
            className='sync-modal-close'
            onClick={() => {
              // Limpiar notificaciones al cerrar
              if (typeof globalThis.clearAllNotifications === 'function') {
                globalThis.clearAllNotifications();
              }

              // Cerrar modal usando el mecanismo disponible
              if (closeModal) {
                closeModal('syncModal');
              } else if (typeof onClose === 'function') {
                onClose();
              }
            }}
          >
            ×
          </button>
        </div>

        <div className='sync-modal-content'>
          {syncStatus === 'pending' &&
            renderPendingState({ lastSyncTime, handleSync, onCloseModal })}
          {syncStatus === 'syncing' && renderSyncingState({ syncMessage, syncProgress })}
          {syncStatus === 'success' && renderSuccessState({ syncMessage })}
          {syncStatus === 'error' && renderErrorState({ syncMessage, handleSync, onClose })}
        </div>
      </div>
    </div>
  );
};

SyncModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSync: PropTypes.func.isRequired,
  project: PropTypes.object,
  _onNotify: PropTypes.func, // Unused parameter, kept for interface consistency
};

export default SyncModal;

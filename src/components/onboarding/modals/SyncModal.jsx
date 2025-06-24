import React, { useState, useEffect, useContext } from 'react';
import './SyncModal.css';
// Importar el contexto global
import { useGlobalContext } from '../../../context/GlobalProvider';

/**
 * Modal para sincronizar y respaldar los cambios del editor de flujos
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onSync - Función para sincronizar y guardar cambios
 * @param {Object} props.project - Información del proyecto actual
 * @param {Function} props.onNotify - Función para notificar eventos (opcional)
 */
const SyncModal = ({ onClose, onSync, project, onNotify }) => {
  // Usar el contexto global para acceder a las funciones de notificación
  const { showNotification, setByteMessage, closeModal } = useGlobalContext();
  
  const [syncStatus, setSyncStatus] = useState('pending');
  const [lastSyncTime, setLastSyncTime] = useState(null);
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
  
  /**
   * Función para notificar mensajes de forma segura utilizando el contexto global
   * @param {string} message - El mensaje a mostrar
   * @param {string} type - El tipo de notificación ('success', 'error', 'info', 'warning')
   */
  const notify = (message, type = 'info') => {
    // 1. Actualizar el estado local del modal
    setSyncMessage(message);
    
    // 2. Usar el sistema global de notificaciones solo una vez (evitar duplicados)
    // Solo mostrar notificación para errores o la notificación final de éxito
    if (type === 'error' || message === 'Sincronización completada') {
      // Limpiar notificaciones anteriores para evitar acumulación
      if (typeof window.clearAllNotifications === 'function') {
        window.clearAllNotifications();
      }
      
      showNotification(message, type, type === 'success' ? 2000 : 3000);
    }
    
    // 3. No usamos más onNotify para evitar duplicados
  };
  
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
      if (typeof window.clearAllNotifications === 'function') {
        window.clearAllNotifications();
      }
      
      // Simular progreso de sincronización sin generar notificaciones para cada paso
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
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
        await onSync();
        
        // Simular finalización
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Registrar la fecha y hora de sincronización
        const now = new Date();
        localStorage.setItem(`plubot-last-sync-${project?.id}`, now.toISOString());
        setLastSyncTime(now);
        // Actualizar estado
        setSyncStatus('success');
        
        // Limpiar notificaciones anteriores para evitar acumulación
        if (typeof window.clearAllNotifications === 'function') {
          window.clearAllNotifications();
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
    <div className="sync-modal-overlay">
      <div className="sync-modal">
        <div className="sync-modal-header">
          <h2>{project?.name || 'Editor de Flujos'} - Sincronización</h2>
          <button 
            className="sync-modal-close" 
            onClick={() => {
              // Limpiar notificaciones al cerrar
              if (typeof window.clearAllNotifications === 'function') {
                window.clearAllNotifications();
              }
              
              // Cerrar modal usando el mecanismo disponible
              if (closeModal) {
                closeModal('syncModal');
              } else if (typeof onClose === 'function') {
                onClose();
              }
            }}
          >×</button>
        </div>
        
        <div className="sync-modal-content">
          {syncStatus === 'pending' && (
            <>
              <div className="sync-modal-info">
                <p>Al sincronizar tu flujo de conversación:</p>
                <ul>
                  <li>Se guardarán todos los cambios realizados</li>
                  <li>Se creará un respaldo local en tu navegador</li>
                  <li>Se protegerá tu trabajo contra pérdidas accidentales</li>
                </ul>
                
                {lastSyncTime && (
                  <p className="sync-last-time">
                    Última sincronización: {lastSyncTime.toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="sync-modal-actions">
                <button 
                  className="sync-button primary" 
                  onClick={handleSync}
                >
                  Sincronizar Ahora
                </button>
                <button 
                  className="sync-button secondary" 
                  onClick={() => {
                    if (closeModal) {
                      closeModal('syncModal');
                    } else if (typeof onClose === 'function') {
                      onClose();
                    }
                  }}
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
          
          {syncStatus === 'syncing' && (
            <div className="sync-progress-container">
              <div className="sync-progress-animation">
                <div className="sync-circle"></div>
                <div className="sync-pulse"></div>
              </div>
              <p className="sync-message">{syncMessage}</p>
              <div className="sync-progress-bar">
                <div 
                  className="sync-progress-fill" 
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {syncStatus === 'success' && (
            <div className="sync-result success">
              <div className="sync-success-icon">✓</div>
              <p>{syncMessage}</p>
            </div>
          )}
          
          {syncStatus === 'error' && (
            <div className="sync-result error">
              <div className="sync-error-icon">!</div>
              <p>{syncMessage}</p>
              <button 
                className="sync-button primary" 
                onClick={handleSync}
              >
                Reintentar
              </button>
              <button 
                className="sync-button secondary" 
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncModal;

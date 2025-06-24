import React, { createContext, useContext, useState, useEffect } from 'react';
import '../styles/notifications.css'; // Importar los estilos desde archivo CSS separado

// Contexto global para toda la aplicación
const GlobalContext = createContext();

/**
 * Hook para acceder al contexto global en cualquier componente
 * @returns {Object} El contexto global
 */
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext debe ser usado dentro de un GlobalProvider');
  }
  return context;
};

/**
 * Proveedor global que inyecta funcionalidades comunes a toda la aplicación
 */
export const GlobalProvider = ({ children }) => {
  // Referencias a los datos del flujo actual (necesario para modales)
  const [currentFlowData, setCurrentFlowData] = useState({
    nodes: [],
    edges: [],
    plubotId: null,
    plubotName: 'Mi Plubot',
    project: { id: null, name: 'Proyecto' },
  });

  // Sistema de notificaciones
  const [notifications, setNotifications] = useState([]);

  // Sistema de modales
  const [activeModals, setActiveModals] = useState({
    embedModal: false, // Modal de compartir
    templateSelector: false, // Modal de plantillas
    importExportModal: false, // Modal de opciones
    simulationModal: false, // Modal de simulación
    syncModal: false, // Modal de sincronización
    suggestionsModal: false, // Modal de sugerencias
  });

  // Sistema de mensajes globales (ByteMessage)
  const [byteMessage, setByteMessage] = useState('');
  const [byteMessageType, setByteMessageType] = useState('info');

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);

    // Auto-eliminar después de la duración
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }


    return id; // Devolver id para poder eliminar manualmente
  };

  // Función para eliminar notificaciones
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Función para limpiar todas las notificaciones
  const clearAllNotifications = () => {

    setNotifications([]);
  };

  // Hacer disponible globalmente para que otros componentes puedan acceder
  React.useEffect(() => {
    window.clearAllNotifications = clearAllNotifications;

    // Agregar manejador para eventos de guardado (byte-message)
    const handleByteMessage = (event) => {
      const { message, status = 'success' } = event.detail;


      // Mostrar la notificación usando el sistema centralizado
      showNotification(message, status === 'error' ? 'error' : 'success');
    };

    // Registrar listener para byte-message (usado por EpicHeader para guardar)
    window.addEventListener('byte-message', handleByteMessage);

    // Exponer la función de notificación a nivel global
    window.showGlobalNotification = (message, type) => showNotification(message, type);

    return () => {
      delete window.clearAllNotifications;
      delete window.showGlobalNotification;
      window.removeEventListener('byte-message', handleByteMessage);
    };
  }, []);

  // Función para abrir modales
  const openModal = (modalName) => {

    // Verificar que el modal existe
    if (!activeModals.hasOwnProperty(modalName)) {
      return false;
    }

    // Cerrar cualquier otro modal abierto
    const resetModals = Object.keys(activeModals).reduce((acc, key) => {
      acc[key] = key === modalName;
      return acc;
    }, {});

    setActiveModals(resetModals);
    return true;
  };

  // Función para cerrar modales
  const closeModal = (modalName) => {

    if (modalName === 'all') {
      // Cerrar todos los modales
      const resetModals = Object.keys(activeModals).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      setActiveModals(resetModals);
    } else if (activeModals.hasOwnProperty(modalName)) {
      // Cerrar un modal específico
      setActiveModals(prev => ({
        ...prev,
        [modalName]: false,
      }));
    }

    // Disparar evento global como respaldo
    try {
      window.dispatchEvent(new CustomEvent('plubot-close-modal', {
        detail: { modal: modalName, timestamp: Date.now() },
      }));
    } catch (error) {
      // Silently catch errors
    }

    return true;
  };

  // Función global para ByteMessage
  const setGlobalByteMessage = (message, type = 'info') => {
    setByteMessage(message);
    setByteMessageType(type);

    // También mostrar como notificación para mayor visibilidad
    showNotification(message, type);

    // Disparar evento global como respaldo
    try {
      window.dispatchEvent(new CustomEvent('plubot-byte-message', {
        detail: { message, type, timestamp: Date.now() },
      }));
    } catch (e) {}

  };

  // useEffect for window.setByteMessage management removed as part of refactoring.

  // Escuchar eventos globales para modales (pero evitando bucles infinitos)
  useEffect(() => {
    // Evitamos el bucle infinito usando un flag
    let isHandlingEvent = false;

    const handleOpenModal = (event) => {
      // Prevenimos bucles infinitos
      if (isHandlingEvent) return;

      try {
        isHandlingEvent = true;
        const { modal, source } = event.detail;

        // Solo procesar si el evento no vino del GlobalProvider (para evitar bucles)
        if (modal && source !== 'GlobalProvider' && activeModals.hasOwnProperty(modal)) {
          // Actualizamos directamente el estado sin llamar a openModal
          setActiveModals(prev => ({
            ...Object.keys(prev).reduce((acc, key) => {
              acc[key] = false;
              return acc;
            }, {}),
            [modal]: true,
          }));
        }
      } finally {
        isHandlingEvent = false;
      }
    };

    const handleCloseModal = (event) => {
      // Prevenimos bucles infinitos
      if (isHandlingEvent) return;

      try {
        isHandlingEvent = true;
        const { modal } = event.detail;
        if (modal) {
          if (modal === 'all') {
            setActiveModals(prev => (
              Object.keys(prev).reduce((acc, key) => {
                acc[key] = false;
                return acc;
              }, {})
            ));
          } else if (activeModals.hasOwnProperty(modal)) {
            setActiveModals(prev => ({ ...prev, [modal]: false }));
          }
        }
      } finally {
        isHandlingEvent = false;
      }
    };

    const handleByteMessage = (event) => {
      const { message, type } = event.detail;
      if (message) {
        // Actualizamos los estados directamente sin llamar a la función que podría disparar eventos
        setByteMessage(message);
        setByteMessageType(type || 'info');
        showNotification(message, type || 'info');
      }
    };

    // Suscribimos a los eventos
    window.addEventListener('plubot-open-modal', handleOpenModal);
    window.addEventListener('plubot-close-modal', handleCloseModal);
    window.addEventListener('plubot-byte-message', handleByteMessage);

    // Manejadores para eventos antiguos
    const handleEmbedModal = () => {
      if (!isHandlingEvent) {
        isHandlingEvent = true;
        setActiveModals(prev => ({ ...Object.keys(prev).reduce((acc, key) => {
          acc[key] = false; return acc;
        }, {}), embedModal: true }));
        isHandlingEvent = false;
      }
    };

    const handleTemplateModal = () => {
      if (!isHandlingEvent) {
        isHandlingEvent = true;
        setActiveModals(prev => ({ ...Object.keys(prev).reduce((acc, key) => {
          acc[key] = false; return acc;
        }, {}), templateSelector: true }));
        isHandlingEvent = false;
      }
    };

    const handleImportExportModal = () => {
      if (!isHandlingEvent) {
        isHandlingEvent = true;
        setActiveModals(prev => ({ ...Object.keys(prev).reduce((acc, key) => {
          acc[key] = false; return acc;
        }, {}), importExportModal: true }));
        isHandlingEvent = false;
      }
    };

    const handleSimulationModal = () => {
      if (!isHandlingEvent) {
        isHandlingEvent = true;
        setActiveModals(prev => ({ ...Object.keys(prev).reduce((acc, key) => {
          acc[key] = false; return acc;
        }, {}), simulationModal: true }));
        isHandlingEvent = false;
      }
    };

    const handleSyncModal = () => {
      if (!isHandlingEvent) {
        isHandlingEvent = true;
        setActiveModals(prev => ({ ...Object.keys(prev).reduce((acc, key) => {
          acc[key] = false; return acc;
        }, {}), syncModal: true }));
        isHandlingEvent = false;
      }
    };

    // Manejador para eventos de guardado de flujo
    const handleFlowSaved = (event) => {
      const { success, message } = event.detail || {};
      if (success) {
        showNotification(message || 'Flujo guardado correctamente', 'success');
      } else {
        showNotification(message || 'Error al guardar el flujo', 'error');
      }
    };

    window.addEventListener('open-embed-modal', handleEmbedModal);
    window.addEventListener('open-templates-modal', handleTemplateModal);
    window.addEventListener('open-import-export-modal', handleImportExportModal);
    window.addEventListener('open-simulate-modal', handleSimulationModal);
    window.addEventListener('open-sync-modal', handleSyncModal);
    window.addEventListener('flow-saved', handleFlowSaved);

    return () => {
      // Limpieza
      window.removeEventListener('plubot-open-modal', handleOpenModal);
      window.removeEventListener('plubot-close-modal', handleCloseModal);
      window.removeEventListener('plubot-byte-message', handleByteMessage);

      window.removeEventListener('open-embed-modal', handleEmbedModal);
      window.removeEventListener('open-templates-modal', handleTemplateModal);
      window.removeEventListener('open-import-export-modal', handleImportExportModal);
      window.removeEventListener('open-simulate-modal', handleSimulationModal);
      window.removeEventListener('open-sync-modal', handleSyncModal);
      window.removeEventListener('flow-saved', handleFlowSaved);
    };
  }, [activeModals, showNotification]);

  // Función para actualizar datos del flujo actual
  const updateCurrentFlowData = (newData) => {
    setCurrentFlowData(prev => ({
      ...prev,
      ...newData,
    }));
  };

  // Reaccionar a cambios en el DOM para capturar datos del flujo actual
  useEffect(() => {
    const handleFlowDataUpdate = (event) => {
      try {
        const { nodes, edges, plubotId, plubotName, project } = event.detail;
        updateCurrentFlowData({
          nodes: nodes || [],
          edges: edges || [],
          plubotId: plubotId || null,
          plubotName: plubotName || 'Mi Plubot',
          project: project || { id: null, name: 'Proyecto' },
        });
      } catch (error) {
        // Silently catch errors
      }
    };

    window.addEventListener('plubot-flow-data-update', handleFlowDataUpdate);

    return () => {
      window.removeEventListener('plubot-flow-data-update', handleFlowDataUpdate);
    };
  }, []);

  // Valor del contexto
  const contextValue = {
    // Notificaciones
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    // Modales
    activeModals,
    openModal,
    closeModal,
    closeAllModals: () => closeModal('all'),

    // ByteMessage
    byteMessage,
    byteMessageType,
    setByteMessage: setGlobalByteMessage,

    // Datos del flujo
    currentFlowData,
    updateCurrentFlowData,
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}

      {/* Renderizar notificaciones */}
      <div className="global-notifications">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`global-notification notification-${notification.type}`}
          >
            <span className="notification-message">{notification.message}</span>
            <button
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;

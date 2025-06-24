/**
 * Hook personalizado para gestionar modales de manera eficiente en la aplicaciu00f3n.
 * Proporciona una manera centralizada de controlar quu00e9 modales estu00e1n abiertos
 * y coordina su interacciu00f3n para evitar problemas de UI.
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { createContext, useContext } from 'react';

// Contexto para compartir el estado de los modales entre componentes
const ModalContext = createContext();

/**
 * Proveedor de contexto para el sistema de modales
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export const ModalProvider = ({ children }) => {
  // Estado central para todos los modales de la aplicaciu00f3n
  const [modals, setModals] = useState({});

  // Historial de modales para gestionar la navegaciu00f3n entre ellos
  const [modalHistory, setModalHistory] = useState([]);

  // Contador para generar IDs u00fanicos para modales dinu00e1micos
  const [idCounter, setIdCounter] = useState(1);

  // Estado para controlar si hay algu00fan modal bloqueante activo
  const [hasBlockingModal, setHasBlockingModal] = useState(false);

  // Efecto para actualizar el estado de bloqueo basado en modales activos
  useEffect(() => {
    const blocking = Object.values(modals).some(modal =>
      modal.isOpen && modal.blocking,
    );
    setHasBlockingModal(blocking);
  }, [modals]);

  /**
   * Registra un nuevo modal en el sistema
   * @param {string} id - Identificador u00fanico del modal
   * @param {Object} options - Opciones de configuraciu00f3n
   * @param {boolean} options.blocking - Si el modal bloquea la interacciu00f3n con otros elementos
   * @param {number} options.zIndex - u00cdndice Z para posicionamiento
   * @param {string} options.size - Tamau00f1o del modal (small, medium, large, fullscreen)
   * @param {Function} options.onBeforeClose - Funciu00f3n a ejecutar antes de cerrar
   * @returns {string} ID del modal registrado
   */
  const registerModal = useCallback((id = null, options = {}) => {
    const modalId = id || `modal-${idCounter}`;

    setModals(prev => {
      // Si el modal ya existe, solo actualizar sus opciones
      if (prev[modalId]) {
        return {
          ...prev,
          [modalId]: {
            ...prev[modalId],
            ...options,
          },
        };
      }

      // Si es un modal nuevo, crear su configuraciu00f3n completa
      return {
        ...prev,
        [modalId]: {
          id: modalId,
          isOpen: false,
          data: null,
          blocking: options.blocking || false,
          zIndex: options.zIndex || 1000,
          size: options.size || 'medium',
          onBeforeClose: options.onBeforeClose || null,
          history: options.preserveHistory || false,
        },
      };
    });

    if (!id) {
      setIdCounter(prev => prev + 1);
    }

    return modalId;
  }, [idCounter]);

  /**
   * Abre un modal especu00edfico
   * @param {string} id - ID del modal a abrir
   * @param {Object} data - Datos a pasar al modal
   */
  const openModal = useCallback((id, data = null) => {
    if (!modals[id]) {
      return;
    }

    // Actualizar el modal especu00edfico
    setModals(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isOpen: true,
        data,
      },
    }));

    // Au00f1adir al historial si corresponde
    if (modals[id].history) {
      setModalHistory(prev => [...prev, { id, data }]);
    }
  }, [modals]);

  /**
   * Cierra un modal especu00edfico
   * @param {string} id - ID del modal a cerrar
   * @param {Object} result - Resultado o datos de salida del modal
   */
  const closeModal = useCallback(async (id, result = null) => {
    if (!modals[id]) {
      return;
    }

    // Ejecutar funciu00f3n onBeforeClose si existe
    const modal = modals[id];
    if (modal.onBeforeClose) {
      try {
        const shouldClose = await modal.onBeforeClose(result);
        if (shouldClose === false) {
          return; // Prevenir el cierre si onBeforeClose retorna false
        }
      } catch (error) {

        // Continuar con el cierre a pesar del error
      }
    }

    // Actualizar el estado del modal
    setModals(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isOpen: false,
        data: null,
      },
    }));

    // Actualizar historial si corresponde
    if (modal.history) {
      setModalHistory(prev => prev.filter(item => item.id !== id));
    }
  }, [modals]);

  /**
   * Cierra todos los modales abiertos
   */
  const closeAllModals = useCallback(() => {
    // Identificar modales abiertos
    const openModalIds = Object.entries(modals)
      .filter(([_, modal]) => modal.isOpen)
      .map(([id]) => id);

    // Cerrar cada modal abierto
    openModalIds.forEach(id => {
      closeModal(id);
    });

    // Limpiar historial
    setModalHistory([]);
  }, [modals, closeModal]);

  /**
   * Obtiene datos sobre el estado de un modal
   * @param {string} id - ID del modal
   * @returns {Object} Informaciu00f3n del modal o null si no existe
   */
  const getModalState = useCallback((id) => {
    return modals[id] || null;
  }, [modals]);

  // Crear el objeto de valor del contexto
  const contextValue = useMemo(() => ({
    modals,
    modalHistory,
    hasBlockingModal,
    registerModal,
    openModal,
    closeModal,
    closeAllModals,
    getModalState,
  }), [modals, modalHistory, hasBlockingModal, registerModal, openModal, closeModal, closeAllModals, getModalState]);

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
};

/**
 * Hook para usar el sistema de modales en cualquier componente
 * @returns {Object} API de gestiu00f3n de modales
 */
export const useModalManager = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalManager debe utilizarse dentro de un ModalProvider');
  }
  return context;
};

export default useModalManager;

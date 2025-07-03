/**
 * Hook personalizado para gestionar modales de manera eficiente en la aplicaciu00f3n.
 * Proporciona una manera centralizada de controlar quu00e9 modales estu00e1n abiertos
 * y coordina su interacciu00f3n para evitar problemas de UI.
 */
import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  createContext,
  useContext,
} from 'react';

// Contexto para compartir el estado de los modales entre componentes
const ModalContext = createContext();

/**
 * Proveedor de contexto para el sistema de modales
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export const ModalProvider = ({ children }) => {
  // Estado central para todos los modales de la aplicaciu00f3n
  const [modals, setModals] = useState(new Map());

  // Historial de modales para gestionar la navegaciu00f3n entre ellos
  const [modalHistory, setModalHistory] = useState([]);

  // Contador para generar IDs u00fanicos para modales dinu00e1micos
  const [idCounter, setIdCounter] = useState(1);

  // Estado para controlar si hay algu00fan modal bloqueante activo
  const [hasBlockingModal, setHasBlockingModal] = useState(false);

  // Efecto para actualizar el estado de bloqueo basado en modales activos
  useEffect(() => {
    const blocking = [...modals.values()].some(
      (modal) => modal.isOpen && modal.blocking,
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
  const registerModal = useCallback(
    (id = null, options = {}) => {
      // Security guard against prototype pollution.
      if (id === '__proto__' || id === 'constructor' || id === 'prototype') {
        return null;
      }
      const modalId = id || `modal-${idCounter}`;

      setModals((previous) => {
        const newModals = new Map(previous);
        const existingModal = newModals.get(modalId);

        if (existingModal) {
          // Si el modal ya existe, solo actualizar sus opciones
          newModals.set(modalId, { ...existingModal, ...options });
        } else {
          // Si es un modal nuevo, crear su configuraciu00f3n completa
          newModals.set(modalId, {
            id: modalId,
            isOpen: false,
            data: null,
            blocking: options.blocking || false,
            zIndex: options.zIndex || 1000,
            size: options.size || 'medium',
            onBeforeClose: options.onBeforeClose || null,
            history: options.preserveHistory || false,
          });
        }
        return newModals;
      });

      if (!id) {
        setIdCounter((previous) => previous + 1);
      }

      return modalId;
    },
    [idCounter],
  );

  /**
   * Abre un modal especu00edfico
   * @param {string} id - ID del modal a abrir
   * @param {Object} data - Datos a pasar al modal
   */
  const openModal = useCallback(
    (id, data = null) => {
      if (!modals.has(id)) {
        return;
      }
      const modal = modals.get(id);

      // Actualizar el modal especu00edfico
      setModals((previous) => {
        const newModals = new Map(previous);
        const currentModal = newModals.get(id);
        if (currentModal) {
          newModals.set(id, { ...currentModal, isOpen: true, data });
        }
        return newModals;
      });

      // Au00f1adir al historial si corresponde
      if (modal.history) {
        setModalHistory((previous) => [...previous, { id, data }]);
      }
    },
    [modals],
  );

  /**
   * Cierra un modal especu00edfico
   * @param {string} id - ID del modal a cerrar
   * @param {Object} result - Resultado o datos de salida del modal
   */
  const closeModal = useCallback(
    async (id, result = null) => {
      if (!modals.has(id)) {
        return;
      }

      // Ejecutar funciu00f3n onBeforeClose si existe
      const modal = modals.get(id);
      if (modal.onBeforeClose) {
        try {
          const shouldClose = await modal.onBeforeClose(result);
          if (shouldClose === false) {
            return; // Prevenir el cierre si onBeforeClose retorna false
          }
        } catch {
          // Continuar con el cierre a pesar del error
        }
      }

      // Actualizar el estado del modal
      setModals((previous) => {
        const newModals = new Map(previous);
        const currentModal = newModals.get(id);
        if (currentModal) {
          newModals.set(id, { ...currentModal, isOpen: false, data: null });
        }
        return newModals;
      });

      // Actualizar historial si corresponde
      if (modal.history) {
        setModalHistory((previous) =>
          previous.filter((item) => item.id !== id),
        );
      }
    },
    [modals],
  );

  /**
   * Cierra todos los modales abiertos
   */
  const closeAllModals = useCallback(() => {
    // Identificar modales abiertos
    const openModalIds = [...modals.entries()]
      .filter(([, modal]) => modal.isOpen)
      .map(([id]) => id);

    // Cerrar cada modal abierto
    for (const id of openModalIds) {
      closeModal(id);
    }

    // Limpiar historial
    setModalHistory([]);
  }, [modals, closeModal]);

  /**
   * Obtiene datos sobre el estado de un modal
   * @param {string} id - ID del modal
   * @returns {Object} Informaciu00f3n del modal o null si no existe
   */
  const getModalState = useCallback(
    (id) => {
      return modals.get(id) || null;
    },
    [modals],
  );

  // Crear el objeto de valor del contexto
  const contextValue = useMemo(
    () => ({
      modals,
      modalHistory,
      hasBlockingModal,
      registerModal,
      openModal,
      closeModal,
      closeAllModals,
      getModalState,
    }),
    [
      modals,
      modalHistory,
      hasBlockingModal,
      registerModal,
      openModal,
      closeModal,
      closeAllModals,
      getModalState,
    ],
  );

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
    throw new Error(
      'useModalManager debe utilizarse dentro de un ModalProvider',
    );
  }
  return context;
};

export default useModalManager;

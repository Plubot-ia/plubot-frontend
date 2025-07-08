/**
 * Hook personalizado para gestionar modales de manera eficiente en la aplicación.
 * Proporciona una manera centralizada de controlar qué modales están abiertos
 * y coordina su interacción para evitar problemas de UI.
 */
import PropTypes from 'prop-types';
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
export function ModalProvider({ children }) {
  // Estado central para todos los modales de la aplicación
  const [modals, setModals] = useState(new Map());

  // Historial de modales para gestionar la navegación entre ellos
  const [modalHistory, setModalHistory] = useState([]);

  // Contador para generar IDs únicos para modales dinámicos
  const [idCounter, setIdCounter] = useState(1);

  // Estado para controlar si hay algún modal bloqueante activo
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
   * @param {string} id - Identificador único del modal
   * @param {Object} options - Opciones de configuración
   * @param {boolean} options.blocking - Si el modal bloquea la interacción con otros elementos
   * @param {number} options.zIndex - Índice Z para posicionamiento
   * @param {string} options.size - Tamaño del modal (small, medium, large, fullscreen)
   * @param {Function} options.onBeforeClose - Función a ejecutar antes de cerrar
   * @returns {string} ID del modal registrado
   */
  const registerModal = useCallback(
    (id, options = {}) => {
      // Security guard against prototype pollution.
      if (id === '__proto__' || id === 'constructor' || id === 'prototype') {
        return;
      }
      const modalId = id || `modal-${idCounter}`;

      setModals((previous) => {
        const newModals = new Map(previous);
        // Get existing modal or create a base for a new one
        const baseModal = newModals.get(modalId) || {
          id: modalId,
          isOpen: false,
          data: undefined,
          blocking: false,
          zIndex: 1000,
          size: 'medium',
          onBeforeClose: undefined,
          history: false,
        };

        // Merge base with new options to get the final state
        const finalModal = { ...baseModal, ...options };

        newModals.set(modalId, finalModal);
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
   * Abre un modal específico
   * @param {string} id - ID del modal a abrir
   * @param {Object} data - Datos a pasar al modal
   */
  const openModal = useCallback((id, data) => {
    setModals((previousModals) => {
      const modal = previousModals.get(id);
      if (!modal) {
        return previousModals;
      }

      const newModals = new Map(previousModals);
      newModals.set(id, { ...modal, isOpen: true, data });

      if (modal.history) {
        setModalHistory((previousHistory) => [
          ...previousHistory,
          { id, data },
        ]);
      }

      return newModals;
    });
  }, []);

  /**
   * Cierra un modal específico
   * @param {string} id - ID del modal a cerrar
   * @param {Object} result - Resultado o datos de salida del modal
   */
  const closeModal = useCallback(
    async (id, result) => {
      if (!modals.has(id)) {
        return;
      }

      // Ejecutar función onBeforeClose si existe
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
          newModals.set(id, {
            ...currentModal,
            isOpen: false,
            data: undefined,
          });
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
    setModals((previousModals) => {
      const newModals = new Map(previousModals);
      let hasChanged = false;
      for (const [id, modal] of newModals.entries()) {
        if (modal.isOpen) {
          newModals.set(id, { ...modal, isOpen: false, data: undefined });
          hasChanged = true;
        }
      }
      return hasChanged ? newModals : previousModals;
    });

    setModalHistory([]);
  }, []);

  /**
   * Obtiene datos sobre el estado de un modal
   * @param {string} id - ID del modal
   * @returns {Object} Información del modal o null si no existe
   */
  const getModalState = useCallback(
    (id) => {
      return modals.get(id) || undefined;
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
}

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook para usar el sistema de modales en cualquier componente
 * @returns {Object} API de gestión de modales
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

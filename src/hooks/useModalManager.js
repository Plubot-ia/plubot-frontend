/**
 * Hook personalizado para gestionar modales de manera eficiente en la aplicación.
 * Proporciona una manera centralizada de controlar qué modales están abiertos
 * y coordina su interacción para evitar problemas de UI.
 */
import PropTypes from 'prop-types';
import { useMemo, createContext, useContext } from 'react';

import { useModalDerivedState } from './useModalDerivedState';
import { useModalState } from './useModalState';

// Contexto para compartir el estado de los modales entre componentes
const ModalContext = createContext();

/**
 * Proveedor de contexto para el sistema de modales
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export function ModalProvider({ children }) {
  const { modals, modalHistory, registerModal, openModal, closeModal, closeAllModals } =
    useModalState();

  const { hasBlockingModal, getModalState } = useModalDerivedState(modals);

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

  return <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>;
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
    throw new Error('useModalManager debe utilizarse dentro de un ModalProvider');
  }
  return context;
};

export default useModalManager;

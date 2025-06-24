/**
 * modal-manager.js
 * Sistema global para gestionar la apertura y cierre de modales en la aplicación
 */

// Estado interno de los modales
const modalState = {
  activeModals: {},
  listeners: [],
};

/**
 * Registra un listener para cambios en el estado de los modales
 * @param {Function} listener - Función que recibe el nuevo estado
 * @returns {Function} Función para eliminar el listener
 */
export const registerModalListener = (listener) => {
  modalState.listeners.push(listener);

  // Devolver función para eliminar el listener
  return () => {
    modalState.listeners = modalState.listeners.filter(l => l !== listener);
  };
};

/**
 * Abre un modal específico
 * @param {string} modalName - Nombre del modal a abrir
 * @param {Object} props - Propiedades adicionales para pasar al modal
 */
export const openModal = (modalName, props = {}) => {


  // Actualizar estado interno
  modalState.activeModals[modalName] = {
    isOpen: true,
    props,
    timestamp: Date.now(),
  };

  // Notificar a todos los listeners
  modalState.listeners.forEach(listener => {
    try {
      listener({ ...modalState.activeModals });
    } catch (error) {}
  });

  // Emitir evento global para componentes que escuchan eventos
  try {
    window.dispatchEvent(new CustomEvent('plubot-modal-open', {
      detail: { modalName, props, timestamp: Date.now() },
    }));
  } catch (e) {}
};

/**
 * Cierra un modal específico
 * @param {string} modalName - Nombre del modal a cerrar
 */
export const closeModal = (modalName) => {


  // Actualizar estado interno
  if (modalState.activeModals[modalName]) {
    modalState.activeModals[modalName].isOpen = false;
  }

  // Notificar a todos los listeners
  modalState.listeners.forEach(listener => {
    try {
      listener({ ...modalState.activeModals });
    } catch (error) {}
  });

  // Emitir evento global para componentes que escuchan eventos
  try {
    window.dispatchEvent(new CustomEvent('plubot-modal-close', {
      detail: { modalName, timestamp: Date.now() },
    }));
  } catch (e) {}
};

/**
 * Comprueba si un modal está abierto
 * @param {string} modalName - Nombre del modal a comprobar
 * @returns {boolean} True si el modal está abierto, false en caso contrario
 */
export const isModalOpen = (modalName) => {
  return modalState.activeModals[modalName]?.isOpen === true;
};

/**
 * Obtiene las propiedades de un modal específico
 * @param {string} modalName - Nombre del modal
 * @returns {Object|null} Propiedades del modal o null si no existe
 */
export const getModalProps = (modalName) => {
  return modalState.activeModals[modalName]?.props || null;
};

// Exponer las funciones al objeto window para acceso global
if (typeof window !== 'undefined') {
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.isModalOpen = isModalOpen;
}

// Inicializador: configura eventos para escuchar comunicaciones entre componentes
export const initModalManager = () => {


  // Escuchar eventos de apertura de modales desde otros componentes
  window.addEventListener('plubot-open-modal', (event) => {
    const { modal, props } = event.detail;
    if (modal) {
      openModal(modal, props);
    }
  });

  // Escuchar eventos de cierre de modales desde otros componentes
  window.addEventListener('plubot-close-modal', (event) => {
    const { modal } = event.detail;
    if (modal) {
      closeModal(modal);
    }
  });
};

export default {
  registerModalListener,
  openModal,
  closeModal,
  isModalOpen,
  getModalProps,
  initModalManager,
};

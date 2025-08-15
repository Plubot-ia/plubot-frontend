/**
 * modal-manager.js
 * Sistema global para gestionar la apertura y cierre de modales en la aplicación
 */

// Estado interno de los modales
const modalState = {
  activeModals: new Map(),
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
    modalState.listeners = modalState.listeners.filter((l) => l !== listener);
  };
};

/**
 * Abre un modal específico
 * @param {string} modalName - Nombre del modal a abrir
 * @param {Object} props - Propiedades adicionales para pasar al modal
 */
export const openModal = (modalName, properties = {}) => {
  // Usar Map previene 'prototype pollution'
  modalState.activeModals.set(modalName, {
    isOpen: true,
    props: properties,
    timestamp: Date.now(),
  });

  // Notificar a todos los listeners con el estado del Map
  for (const listener of modalState.listeners) {
    try {
      listener(modalState.activeModals);
    } catch {
      // Error ignorado intencionadamente para mantener la ejecución.
    }
  }

  // Emitir evento global para componentes que escuchan eventos
  try {
    globalThis.dispatchEvent(
      new CustomEvent('plubot-modal-open', {
        detail: { modalName, props: properties, timestamp: Date.now() },
      }),
    );
  } catch {}
};

/**
 * Cierra un modal específico
 * @param {string} modalName - Nombre del modal a cerrar
 */
export const closeModal = (modalName) => {
  // Usar Map previene 'prototype pollution'
  if (modalState.activeModals.has(modalName)) {
    modalState.activeModals.delete(modalName);
  }

  // Notificar a todos los listeners con el estado del Map
  for (const listener of modalState.listeners) {
    try {
      listener(modalState.activeModals);
    } catch {
      // Error ignorado intencionadamente para mantener la ejecución.
    }
  }

  // Emitir evento global para componentes que escuchan eventos
  try {
    globalThis.dispatchEvent(
      new CustomEvent('plubot-modal-close', {
        detail: { modalName, timestamp: Date.now() },
      }),
    );
  } catch {}
};

/**
 * Comprueba si un modal está abierto
 * @param {string} modalName - Nombre del modal a comprobar
 * @returns {boolean} True si el modal está abierto, false en caso contrario
 */
export const isModalOpen = (modalName) => {
  // Usar Map previene 'prototype pollution'
  return modalState.activeModals.get(modalName)?.isOpen === true;
};

/**
 * Obtiene las propiedades de un modal específico
 * @param {string} modalName - Nombre del modal
 * @returns {Object|null} Propiedades del modal o null si no existe
 */
export const getModalProps = (modalName) => {
  // Usar Map previene 'prototype pollution'
  return modalState.activeModals.get(modalName)?.props;
};

// Exponer las funciones al objeto window para acceso global
if (globalThis.window !== undefined) {
  globalThis.openModal = openModal;
  globalThis.closeModal = closeModal;
  globalThis.isModalOpen = isModalOpen;
}

// Inicializador: configura eventos para escuchar comunicaciones entre componentes
export const initModalManager = () => {
  // Escuchar eventos de apertura de modales desde otros componentes
  globalThis.addEventListener('plubot-open-modal', (event) => {
    const { modal, props } = event.detail;
    if (modal) {
      openModal(modal, props);
    }
  });

  // Escuchar eventos de cierre de modales desde otros componentes
  globalThis.addEventListener('plubot-close-modal', (event) => {
    const { modal } = event.detail;
    if (modal) {
      closeModal(modal);
    }
  });
};

const modalManager = {
  registerModalListener,
  openModal,
  closeModal,
  isModalOpen,
  getModalProps,
  initModalManager,
};

export default modalManager;

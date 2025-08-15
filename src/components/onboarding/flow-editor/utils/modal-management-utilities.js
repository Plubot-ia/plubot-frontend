/**
 * @file modal-management-utilities.js
 * @description Utilidades para gestión de modales en el editor de flujo
 * Extraído de useModalManagement.js para reducir max-lines-per-function
 */

import { openModal, closeModal } from '../../utils/modal-manager';

/**
 * Crea funciones de apertura de modales específicos
 * @param {Object} setters - Objeto con funciones setter de estado
 * @returns {Object} Funciones de apertura de modales
 */
export function createModalOpeners(setters) {
  const {
    setShowTemplateSelector,
    setShowEmbedModal,
    setShowImportExportModal,
    setShowSimulation,
    setShowSyncModal,
  } = setters;

  return {
    openTemplateSelector: () => {
      setShowTemplateSelector(true);
      openModal('templateSelector');
    },

    openEmbedModal: () => {
      setShowEmbedModal(true);
      openModal('embedModal');
    },

    openImportExportModal: () => {
      setShowImportExportModal(true);
      openModal('importExportModal');
    },

    openSimulation: () => {
      setShowSimulation(true);
      openModal('simulationModal');
    },

    openSyncModal: () => {
      setShowSyncModal(true);
      openModal('syncModal');
    },
  };
}

/**
 * Crea funciones de cierre de modales específicos
 * @param {Object} setters - Objeto con funciones setter de estado
 * @returns {Object} Funciones de cierre de modales
 */
export function createModalClosers(setters) {
  const {
    setShowTemplateSelector,
    setShowEmbedModal,
    setShowImportExportModal,
    setShowSimulation,
    setShowSyncModal,
  } = setters;

  return {
    closeTemplateSelector: () => {
      setShowTemplateSelector(false);
      closeModal('templateSelector');
    },

    closeEmbedModal: () => {
      setShowEmbedModal(false);
      closeModal('embedModal');
    },

    closeImportExportModal: () => {
      setShowImportExportModal(false);
      closeModal('importExportModal');
    },

    closeSimulation: () => {
      setShowSimulation(false);
      closeModal('simulationModal');
    },

    closeSyncModal: () => {
      setShowSyncModal(false);
      closeModal('syncModal');
    },
  };
}

/**
 * Función genérica para abrir modales por nombre
 * @param {string} modalName - Nombre del modal a abrir
 * @param {Object} openers - Objeto con funciones de apertura
 */
export function openModalByName(modalName, openers) {
  const {
    openTemplateSelector,
    openEmbedModal,
    openImportExportModal,
    openSimulation,
    openSyncModal,
  } = openers;

  switch (modalName) {
    case 'templateSelector': {
      openTemplateSelector();
      break;
    }
    case 'embedModal': {
      openEmbedModal();
      break;
    }
    case 'importExportModal': {
      openImportExportModal();
      break;
    }
    case 'simulationModal': {
      openSimulation();
      break;
    }
    case 'syncModal': {
      openSyncModal();
      break;
    }
    default: {
      openModal(modalName); // Intentar usar el sistema global de todas formas
    }
  }
}

/**
 * Función genérica para cerrar modales por nombre
 * @param {string} modalName - Nombre del modal a cerrar
 * @param {Object} closers - Objeto con funciones de cierre
 */
export function closeModalByName(modalName, closers) {
  const {
    closeTemplateSelector,
    closeEmbedModal,
    closeImportExportModal,
    closeSimulation,
    closeSyncModal,
  } = closers;

  switch (modalName) {
    case 'templateSelector': {
      closeTemplateSelector();
      break;
    }
    case 'embedModal': {
      closeEmbedModal();
      break;
    }
    case 'importExportModal': {
      closeImportExportModal();
      break;
    }
    case 'simulationModal': {
      closeSimulation();
      break;
    }
    case 'syncModal': {
      closeSyncModal();
      break;
    }
    default: {
      closeModal(modalName); // Intentar usar el sistema global de todas formas
    }
  }
}

/**
 * Configura los listeners de eventos globales para modales
 * @param {Function} openModalByNameHandler - Handler para apertura de modales
 * @param {Function} closeModalByNameHandler - Handler para cierre de modales
 * @returns {Function} Función de limpieza para remover listeners
 */
export function setupModalEventListeners(openModalByNameHandler, closeModalByNameHandler) {
  // Registrar listener para eventos de apertura de modales
  const handleGlobalOpenModal = (event) => {
    const { modal } = event.detail;
    openModalByNameHandler(modal);
  };

  // Registrar listener para eventos de cierre de modales
  const handleGlobalCloseModal = (event) => {
    const { modal } = event.detail;
    closeModalByNameHandler(modal);
  };

  // Suscribirse a eventos
  globalThis.addEventListener('plubot-open-modal', handleGlobalOpenModal);
  globalThis.addEventListener('plubot-close-modal', handleGlobalCloseModal);

  // Devolver función de limpieza
  return () => {
    globalThis.removeEventListener('plubot-open-modal', handleGlobalOpenModal);
    globalThis.removeEventListener('plubot-close-modal', handleGlobalCloseModal);
  };
}

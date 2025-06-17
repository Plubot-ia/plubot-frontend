/**
 * useModalManagement.js
 * Hook personalizado para gestionar la apertura y cierre de modales
 * en el editor de flujos, unificando los diferentes métodos de manejo
 */

import { useState, useEffect, useCallback } from 'react';
import { openModal, closeModal, registerModalListener } from '../../utils/modal-manager';

/**
 * Hook para gestionar el estado de los modales con soporte para los sistemas
 * antiguos y el nuevo sistema de modales
 * @returns {Object} Funciones y estados para manejar modales
 */
const useModalManagement = () => {
  // Estado local para compatibilidad con código existente
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Funciones para abrir modales (combinan el sistema local y global)
  const openTemplateSelector = useCallback(() => {
    console.log('[useModalManagement] Abriendo TemplateSelector');
    setShowTemplateSelector(true);
    openModal('templateSelector');
  }, []);

  const openEmbedModal = useCallback(() => {
    console.log('[useModalManagement] Abriendo EmbedModal');
    setShowEmbedModal(true);
    openModal('embedModal');
  }, []);

  const openImportExportModal = useCallback(() => {
    console.log('[useModalManagement] Abriendo ImportExportModal');
    setShowImportExportModal(true);
    openModal('importExportModal');
  }, []);

  const openSimulation = useCallback(() => {
    console.log('[useModalManagement] Abriendo Simulation');
    setShowSimulation(true);
    openModal('simulationModal');
  }, []);

  const openSyncModal = useCallback(() => {
    console.log('[useModalManagement] Abriendo SyncModal');
    setShowSyncModal(true);
    openModal('syncModal');
  }, []);

  // Funciones para cerrar modales (combinan el sistema local y global)
  const closeTemplateSelector = useCallback(() => {
    console.log('[useModalManagement] Cerrando TemplateSelector');
    setShowTemplateSelector(false);
    closeModal('templateSelector');
  }, []);

  const closeEmbedModal = useCallback(() => {
    console.log('[useModalManagement] Cerrando EmbedModal');
    setShowEmbedModal(false);
    closeModal('embedModal');
  }, []);

  const closeImportExportModal = useCallback(() => {
    console.log('[useModalManagement] Cerrando ImportExportModal');
    setShowImportExportModal(false);
    closeModal('importExportModal');
  }, []);

  const closeSimulation = useCallback(() => {
    console.log('[useModalManagement] Cerrando Simulation');
    setShowSimulation(false);
    closeModal('simulationModal');
  }, []);

  const closeSyncModal = useCallback(() => {
    console.log('[useModalManagement] Cerrando SyncModal');
    setShowSyncModal(false);
    closeModal('syncModal');
  }, []);

  // Función genérica para abrir cualquier modal
  const openModalByName = useCallback((modalName) => {
    console.log(`[useModalManagement] Abriendo modal por nombre: ${modalName}`);
    
    if (modalName === 'templateSelector') openTemplateSelector();
    else if (modalName === 'embedModal') openEmbedModal();
    else if (modalName === 'importExportModal') openImportExportModal();
    else if (modalName === 'simulationModal') openSimulation();
    else if (modalName === 'syncModal') openSyncModal();
    else {
      console.warn(`[useModalManagement] Modal desconocido: ${modalName}`);
      openModal(modalName); // Intentar usar el sistema global de todas formas
    }
  }, [openTemplateSelector, openEmbedModal, openImportExportModal, openSimulation, openSyncModal]);

  // Función genérica para cerrar cualquier modal
  const closeModalByName = useCallback((modalName) => {
    console.log(`[useModalManagement] Cerrando modal por nombre: ${modalName}`);
    
    if (modalName === 'templateSelector') closeTemplateSelector();
    else if (modalName === 'embedModal') closeEmbedModal();
    else if (modalName === 'importExportModal') closeImportExportModal();
    else if (modalName === 'simulationModal') closeSimulation();
    else if (modalName === 'syncModal') closeSyncModal();
    else {
      console.warn(`[useModalManagement] Modal desconocido: ${modalName}`);
      closeModal(modalName); // Intentar usar el sistema global de todas formas
    }
  }, [closeTemplateSelector, closeEmbedModal, closeImportExportModal, closeSimulation, closeSyncModal]);

  // Escuchar eventos globales para mantener sincronizados los estados locales
  useEffect(() => {
    // Registrar listener para eventos de apertura de modales
    const handleGlobalOpenModal = (event) => {
      const { modal } = event.detail;
      openModalByName(modal);
    };

    // Registrar listener para eventos de cierre de modales
    const handleGlobalCloseModal = (event) => {
      const { modal } = event.detail;
      closeModalByName(modal);
    };

    // Suscribirse a eventos
    window.addEventListener('plubot-open-modal', handleGlobalOpenModal);
    window.addEventListener('plubot-close-modal', handleGlobalCloseModal);

    // Limpiar al desmontar
    return () => {
      window.removeEventListener('plubot-open-modal', handleGlobalOpenModal);
      window.removeEventListener('plubot-close-modal', handleGlobalCloseModal);
    };
  }, [openModalByName, closeModalByName]);

  return {
    // Estados
    showTemplateSelector,
    showEmbedModal,
    showImportExportModal,
    showSimulation,
    showSyncModal,
    
    // Setters para compatibilidad
    setShowTemplateSelector,
    setShowEmbedModal,
    setShowImportExportModal,
    setShowSimulation,
    setShowSyncModal,
    
    // Funciones específicas
    openTemplateSelector,
    openEmbedModal,
    openImportExportModal,
    openSimulation,
    openSyncModal,
    closeTemplateSelector,
    closeEmbedModal,
    closeImportExportModal,
    closeSimulation,
    closeSyncModal,
    
    // Funciones genéricas
    openModal: openModalByName,
    closeModal: closeModalByName
  };
};

export default useModalManagement;

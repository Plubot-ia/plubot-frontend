/**
 * useModalManagement.js
 * Hook personalizado para gestionar la apertura y cierre de modales
 * en el editor de flujos, unificando los diferentes métodos de manejo
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import {
  createModalOpeners,
  createModalClosers,
  openModalByName,
  closeModalByName,
  setupModalEventListeners,
} from '../utils/modal-management-utilities';

/**
 * Hook para gestionar el estado de los modales con soporte para los sistemas
 * antiguos y el nuevo sistema de modales
 * @returns {Object} Funciones y estados para manejar modales
 */
const useModalManagement = () => {
  // Estado consolidado para todos los modales
  const [modalStates, setModalStates] = useState({
    showTemplateSelector: false,
    showEmbedModal: false,
    showImportExportModal: false,
    showSimulation: false,
    showSyncModal: false,
  });

  // Setters individuales usando useCallback correctamente
  const setShowTemplateSelector = useCallback(
    (value) =>
      setModalStates((previous) => ({
        ...previous,
        showTemplateSelector: value,
      })),
    [],
  );
  const setShowEmbedModal = useCallback(
    (value) => setModalStates((previous) => ({ ...previous, showEmbedModal: value })),
    [],
  );
  const setShowImportExportModal = useCallback(
    (value) =>
      setModalStates((previous) => ({
        ...previous,
        showImportExportModal: value,
      })),
    [],
  );
  const setShowSimulation = useCallback(
    (value) => setModalStates((previous) => ({ ...previous, showSimulation: value })),
    [],
  );
  const setShowSyncModal = useCallback(
    (value) => setModalStates((previous) => ({ ...previous, showSyncModal: value })),
    [],
  );

  // Crear funciones de apertura y cierre usando utilidades - extraído para reducir líneas
  const setters = useMemo(
    () => ({
      setShowTemplateSelector,
      setShowEmbedModal,
      setShowImportExportModal,
      setShowSimulation,
      setShowSyncModal,
    }),
    [
      setShowTemplateSelector,
      setShowEmbedModal,
      setShowImportExportModal,
      setShowSimulation,
      setShowSyncModal,
    ],
  );

  const modalOpeners = useCallback(() => createModalOpeners(setters), [setters]);
  const modalClosers = useCallback(() => createModalClosers(setters), [setters]);
  const openers = modalOpeners();
  const closers = modalClosers();

  // Extraer funciones específicas para compatibilidad
  const {
    openTemplateSelector,
    openEmbedModal,
    openImportExportModal,
    openSimulation,
    openSyncModal,
  } = openers;

  const {
    closeTemplateSelector,
    closeEmbedModal,
    closeImportExportModal,
    closeSimulation,
    closeSyncModal,
  } = closers;

  // Función genérica para abrir cualquier modal - extraído a utilidades
  const openModalByNameHandler = useCallback(
    (modalName) => {
      openModalByName(modalName, openers);
    },
    [openers],
  );

  // Función genérica para cerrar cualquier modal - extraído a utilidades
  const closeModalByNameHandler = useCallback(
    (modalName) => {
      closeModalByName(modalName, closers);
    },
    [closers],
  );

  // Escuchar eventos globales para mantener sincronizados los estados locales - extraído a utilidades
  useEffect(() => {
    return setupModalEventListeners(openModalByNameHandler, closeModalByNameHandler);
  }, [openModalByNameHandler, closeModalByNameHandler]);

  return {
    // Estados desde objeto consolidado
    ...modalStates,
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
    openModal: openModalByNameHandler,
    closeModal: closeModalByNameHandler,
  };
};

export default useModalManagement;

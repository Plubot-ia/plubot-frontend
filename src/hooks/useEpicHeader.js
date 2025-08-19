import { useRef } from 'react';

import useFlowStore from '@/stores/use-flow-store';

import { useClickOutside } from './useClickOutside';
import { useFlowInfo } from './useFlowInfo';
import { useHeaderActions } from './useHeaderActions';
import { useHeaderData } from './useHeaderData';
import { useHeaderReturn } from './useHeaderReturn';
import { useHeaderState } from './useHeaderState';
import { useModalHandlers } from './useModalHandlers';
import { useTrainingModals } from './useTrainingModals';

// Helper function to build header props object
const buildHeaderProps = ({
  isAuthenticated,
  displayFlowName,
  nodeCount,
  edgeCount,
  optionsMenuOpen,
  setOptionsMenuOpen,
  optionsMenuRef,
  isSaving,
  saveStatus,
  notification,
  time,
  handleSaveFlow,
  actions,
  modalActions,
  lastSaved,
  openTemplatesModal,
  storeTemplatesModal,
  openSimulateModal,
  storeSimulateModal,
  openShareModal,
  storeShareModal,
  openModal,
  showNotification,
  nodes,
  edges,
  plubotId,
}) => {
  const result = {
    isAuthenticated,
    displayFlowName,
    nodeCount,
    edgeCount,
    optionsMenuOpen,
    setOptionsMenuOpen,
    optionsMenuRef,
    isSaving,
    saveStatus,
    notification,
    time,
    handleSaveFlow,
    ...actions,
    modalActions, // Pasar modalActions como objeto completo
    ...modalActions, // También desestructurar para compatibilidad
    lastSaved,
    openTemplatesModal,
    storeTemplatesModal,
    openSimulateModal,
    storeSimulateModal,
    openShareModal,
    storeShareModal,
    openModal,
    showNotification,
    nodes,
    edges,
    plubotId,
  };
  return result;
};

const useEpicHeader = ({
  onCloseModals: _onCloseModals,
  flowName: propertiesFlowName,
  openShareModal,
  openSimulateModal,
  openTemplatesModal,
  showOptionsModal,
  openSettingsModal,
  saveFlow: propertiesSaveFlow,
  getVisibleNodeCount,
  plubotId,
}) => {
  const { openModal, closeAllModals, showNotification, lastSaved, saveFlow, isAuthenticated } =
    useHeaderData();
  const { displayFlowName, nodeCount, edgeCount, nodes, edges } = useFlowInfo({
    propertiesFlowName,
    getVisibleNodeCount,
  });

  // Obtener los datos reales de nodes y edges del store para el menú desplegable
  const actualNodes = useFlowStore((state) => state.nodes);
  const actualEdges = useFlowStore((state) => state.edges);
  const {
    optionsMenuOpen,
    setOptionsMenuOpen,
    isSaving,
    setSavingIndicator,
    saveStatus,
    setSaveStatus,
    notification,
    setNotification,
    time,
  } = useHeaderState();

  const optionsMenuRef = useRef(null);

  useClickOutside(
    optionsMenuRef,
    () => {
      setOptionsMenuOpen(false);
    },
    optionsMenuOpen,
  ); // Solo activar cuando el menú esté abierto

  const { storeShareModal, storeSimulateModal, storeTemplatesModal, storeSettingsModal } =
    useTrainingModals();

  const modalActions = useModalHandlers({
    setOptionsMenuOpen,
    showOptionsModal,
    closeAllModals,
    finalSettingsModal: openSettingsModal ?? storeSettingsModal,
    openModal,
  });

  const { handleSaveFlow, ...actions } = useHeaderActions({
    openModal,
    closeAllModals,
    showNotification,
    nodes,
    edges,
    saveFlow,
    propertiesSaveFlow,
    isAuthenticated,
    setSaveStatus,
    setSavingIndicator,
    setNotification,
    isSaving,
    flowName: displayFlowName,
  });

  return useHeaderReturn(
    buildHeaderProps({
      isAuthenticated,
      displayFlowName,
      nodeCount,
      edgeCount,
      optionsMenuOpen,
      setOptionsMenuOpen,
      optionsMenuRef,
      isSaving,
      saveStatus,
      notification,
      time,
      handleSaveFlow,
      actions,
      modalActions,
      lastSaved,
      openTemplatesModal,
      storeTemplatesModal,
      openSimulateModal,
      storeSimulateModal,
      openShareModal,
      storeShareModal,
      openModal,
      showNotification,
      nodes: actualNodes, // Usar los datos reales para el menú
      edges: actualEdges, // Usar los datos reales para el menú
      plubotId,
    }),
  );
};

export default useEpicHeader;

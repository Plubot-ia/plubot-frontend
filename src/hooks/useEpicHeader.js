import { useRef } from 'react';

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
}) => ({
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
});

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
  useClickOutside(optionsMenuRef, () => setOptionsMenuOpen(false));

  const { storeShareModal, storeSimulateModal, storeTemplatesModal, storeSettingsModal } =
    useTrainingModals();
  const modalActions = useModalHandlers({
    setOptionsMenuOpen,
    showOptionsModal,
    closeAllModals,
    finalSettingsModal: openSettingsModal ?? storeSettingsModal,
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
      nodes,
      edges,
      plubotId,
    }),
  );
};

export default useEpicHeader;

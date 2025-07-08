import { useState, useEffect, useRef } from 'react';

import useGlobalContext from '@/hooks/useGlobalContext';
import useSyncService from '@/services/syncService';
import { useFlowMeta, useFlowNodesEdges } from '@/stores/selectors';
import useAuthStore from '@/stores/use-auth-store';
import useTrainingStore from '@/stores/use-training-store';

const useEpicHeader = ({
  onCloseModals,
  logoSrc: logoSource,
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
  const { openModal, closeAllModals, showNotification } = useGlobalContext();
  const { flowName: flowNameFromStore, lastSaved, saveFlow } = useFlowMeta();
  const { isAuthenticated } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
  }));
  const { nodes, edges } = useFlowNodesEdges();

  const displayFlowName =
    propertiesFlowName || flowNameFromStore || 'Flujo sin título';

  const {
    openShareModal: storeShareModal,
    openSimulateModal: storeSimulateModal,
    openTemplatesModal: storeTemplatesModal,
    openSettingsModal: storeSettingsModal,
  } = useTrainingStore((state) => ({
    openShareModal: state.openShareModal,
    openSimulateModal: state.openSimulateModal,
    openTemplatesModal: state.openTemplatesModal,
    openSettingsModal: state.openSettingsModal,
  }));

  const finalShareModal = openShareModal || storeShareModal;
  const finalSimulateModal = openSimulateModal || storeSimulateModal;
  const finalTemplatesModal = openTemplatesModal || storeTemplatesModal;
  const finalSettingsModal = openSettingsModal || storeSettingsModal;

  const visibleNodes = Array.isArray(nodes)
    ? nodes.filter(
        (node) =>
          node && node.position && node.type && !node.hidden && !node.deleted,
      )
    : [];
  const connectionCount = Array.isArray(edges) ? edges.length : 0;

  const nodeCount = getVisibleNodeCount
    ? getVisibleNodeCount()
    : visibleNodes.length;
  const edgeCount = connectionCount;

  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const optionsMenuRef = useRef(null);

  const [isSaving, setSavingIndicator] = useState(false);
  const [saveStatus, setSaveStatus] = useState();
  const [notification, setNotification] = useState();
  const saveTimeoutReference = useRef(null);

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (saveStatus) {
      saveTimeoutReference.current = setTimeout(
        () => setSaveStatus(undefined),
        3000,
      );
    }
    return () => {
      if (saveTimeoutReference.current) {
        clearTimeout(saveTimeoutReference.current);
      }
    };
  }, [saveStatus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target)
      ) {
        setOptionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoClick = () => {
    if (closeAllModals) closeAllModals();
    if (onCloseModals) onCloseModals();
  };

  const handleOpenVersionHistory = () => {
    setOptionsMenuOpen(false);
    globalThis.dispatchEvent(new CustomEvent('open-version-history'));
  };

  const handleOpenImportExport = () => {
    setOptionsMenuOpen(false);
    if (showOptionsModal) showOptionsModal();
  };

  const handleOpenSettingsModal = () => {
    setOptionsMenuOpen(false);
    if (closeAllModals) closeAllModals();
    globalThis.dispatchEvent(new CustomEvent('open-settings-modal'));
    if (typeof finalSettingsModal === 'function') {
      try {
        finalSettingsModal();
      } catch {}
    }
  };

  const handleOpenPathAnalysis = () => {
    setOptionsMenuOpen(false);
    globalThis.dispatchEvent(new CustomEvent('open-route-analysis'));
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Nunca';
    const now = new Date();
    const saved = new Date(lastSaved);
    const diffMinutes = Math.floor((now - saved) / (1000 * 60));
    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    const hours = saved.getHours().toString().padStart(2, '0');
    const minutes = saved.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTime = () => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const { syncAllPlubots } = useSyncService();

  const validateRequiredNodes = (nodesToValidate) => {
    if (!nodesToValidate || !Array.isArray(nodesToValidate)) {
      return { valid: false, message: 'No hay nodos para validar' };
    }
    const startNode = nodesToValidate.find((node) => node.type === 'start');
    const endNode = nodesToValidate.find((node) => node.type === 'end');
    if (!startNode || !endNode) {
      const missingNodes = [];
      if (!startNode) missingNodes.push('inicio');
      if (!endNode) missingNodes.push('fin');
      return {
        valid: false,
        message: `Se requiere al menos un nodo de inicio y un nodo de fin conectados. Falta: ${missingNodes.join(', ')}`,
      };
    }
    return { valid: true };
  };

  const handleSaveFlow = async () => {
    if (isSaving) return;
    try {
      setSavingIndicator(true);
      setSaveStatus();
      const nodesArray = Array.isArray(nodes) ? nodes : [];
      const validation = validateRequiredNodes(nodesArray);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      const saveFunction = propertiesSaveFlow || saveFlow;
      if (!saveFunction) {
        throw new Error('No se encontró función de guardado');
      }
      await saveFunction();
      try {
        if (typeof syncAllPlubots === 'function') {
          await syncAllPlubots();
        }
      } catch {}
      setSaveStatus('success');
      setNotification({
        text: '✅ Flujo guardado exitosamente',
        id: Date.now(),
      });
    } catch (error) {
      setSaveStatus('error');
      setNotification({
        text: `❌ Error al guardar flujo: ${error.message || 'Error desconocido'}`,
        id: Date.now(),
      });
    } finally {
      setSavingIndicator(false);
    }
  };

  return {
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
    handleLogoClick,
    handleOpenVersionHistory,
    handleOpenImportExport,
    handleOpenSettingsModal,
    handleOpenPathAnalysis,
    formatLastSaved,
    formatTime,
    handleSaveFlow,
    finalTemplatesModal,
    finalSimulateModal,
    finalShareModal,
    openModal,
    showNotification,
    nodes,
    edges,
    lastSaved,
    plubotId,
  };
};

export default useEpicHeader;

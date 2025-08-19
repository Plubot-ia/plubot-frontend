import { useCallback } from 'react';

import { getBackupManager } from '@/components/onboarding/flow-editor/utils/flow-backup-manager';
import useFlowStore from '@/stores/use-flow-store';
import { validateRequiredNodes } from '@/utils/node-validators';

export const useHeaderActions = ({
  openModal: _openModal,
  closeAllModals,
  showNotification,
  nodes: _nodes,
  edges: _edges,
  saveFlow,
  propertiesSaveFlow,
  isAuthenticated: _isAuthenticated,
  setSaveStatus,
  setSavingIndicator,
  setNotification: _setNotification,
  isSaving,
  flowName,
}) => {
  // NO suscribirse a los nodos aquí - esto causa re-renders excesivos
  // En su lugar, obtenerlos solo cuando se necesiten en handleSaveFlow

  const handleLogoClick = () => {
    if (closeAllModals) closeAllModals();
  };

  // Función auxiliar para validar y preparar el flujo
  const prepareFlowForSave = useCallback(() => {
    const currentState = useFlowStore.getState();
    const actualNodes = currentState.nodes;
    const actualEdges = currentState.edges;
    const isEmptyFlow = actualNodes.length === 0 && actualEdges.length === 0;

    if (isEmptyFlow) {
      const backupManager = getBackupManager();
      if (backupManager?.isInitialized) {
        backupManager.createBackup({
          reason: 'user_delete_all',
          forceSave: false,
        });
      }
    } else {
      const validation = validateRequiredNodes(actualNodes || []);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
    }

    return isEmptyFlow;
  }, []);

  const handleSaveFlow = useCallback(async () => {
    if (isSaving) return;

    try {
      setSavingIndicator(true);
      setSaveStatus(undefined);

      prepareFlowForSave();

      const saveFunction = propertiesSaveFlow || saveFlow;
      if (!saveFunction) {
        throw new Error('No se encontró función de guardado');
      }

      await saveFunction();

      // Crear backup automático después de guardar exitosamente
      const currentState = useFlowStore.getState();
      const actualNodes = currentState.nodes;
      const actualEdges = currentState.edges;
      
      // Crear backup en localStorage
      const backupKey = 'flow_backups';
      const existingBackups = JSON.parse(localStorage.getItem(backupKey) || '[]');
      
      const newBackup = {
        id: Date.now().toString(),
        name: flowName || `Backup ${new Date().toLocaleDateString('es-ES')}`,
        timestamp: Date.now(),
        nodes: actualNodes,
        edges: actualEdges,
        type: 'auto',
        nodeCount: actualNodes.length,
        edgeCount: actualEdges.length,
        size: JSON.stringify({ nodes: actualNodes, edges: actualEdges }).length,
        reason: 'Guardado automático'
      };
      
      // Mantener máximo 10 backups
      const updatedBackups = [newBackup, ...existingBackups].slice(0, 10);
      localStorage.setItem(backupKey, JSON.stringify(updatedBackups));
      
      // Disparar evento para actualizar el modal de backups si está abierto
      window.dispatchEvent(new Event('backup-created'));
      
      const successMessage = flowName
        ? `Flujo guardado exitosamente como "${flowName}" y backup creado`
        : 'Flujo guardado exitosamente y backup creado';

      // Usar showNotification del ByteMessageProvider que tiene mejor estilo
      showNotification(successMessage, 'success');
    } catch (error) {
      const errorMessage = `Error al guardar flujo: ${error.message || 'Error desconocido'}`;

      // Usar showNotification del ByteMessageProvider que tiene mejor estilo
      showNotification(errorMessage, 'error');
    } finally {
      setSavingIndicator(false);
    }
  }, [
    propertiesSaveFlow,
    saveFlow,
    showNotification,
    isSaving,
    setSavingIndicator,
    setSaveStatus,
    prepareFlowForSave,
    flowName,
  ]);

  return {
    handleLogoClick,
    handleSaveFlow,
  };
};

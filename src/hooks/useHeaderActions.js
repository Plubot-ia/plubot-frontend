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
  setNotification,
  isSaving,
}) => {
  // NO suscribirse a los nodos aquí - esto causa re-renders excesivos
  // En su lugar, obtenerlos solo cuando se necesiten en handleSaveFlow

  const handleLogoClick = () => {
    if (closeAllModals) closeAllModals();
  };

  const handleSaveFlow = useCallback(async () => {
    // Evitar múltiples guardados simultáneos
    if (isSaving) return;

    try {
      // Indicar que se está guardando
      setSavingIndicator(true);
      setSaveStatus(undefined); // Limpiar estado anterior

      // Obtener el estado actual completo del store
      const currentState = useFlowStore.getState();
      const actualNodes = currentState.nodes;
      const actualEdges = currentState.edges;

      // Estado actual antes de guardar

      // Allow saving empty flows if user intentionally deleted all nodes
      const isEmptyFlow = actualNodes.length === 0 && actualEdges.length === 0;

      if (isEmptyFlow) {
        // Guardando flujo vacío (usuario eliminó todos los nodos)
        // Mark this as intentional empty save in backup system
        const backupManager = getBackupManager();
        if (backupManager && backupManager.isInitialized) {
          backupManager.createBackup({
            reason: 'user_delete_all',
            forceSave: false,
          });
        }
      } else {
        // Only validate if not empty
        const nodesToValidate = actualNodes || [];
        const validation = validateRequiredNodes(nodesToValidate);

        if (!validation.valid) {
          throw new Error(validation.message);
        }
      }

      // Usar la función de guardado proporcionada o la del store
      const saveFunction = propertiesSaveFlow || saveFlow;
      if (!saveFunction) {
        throw new Error('No se encontró función de guardado');
      }

      // Ejecutar el guardado
      await saveFunction();

      // Indicar éxito con el estado visual y notificación
      setSaveStatus('success');
      const notificationMessage = isEmptyFlow
        ? '✅ Flujo vacío guardado exitosamente'
        : '✅ Flujo guardado exitosamente';
      setNotification({
        text: notificationMessage,
        id: Date.now(),
      });

      // También mostrar notificación si la función existe
      if (showNotification) {
        showNotification({
          type: 'success',
          message: '✅ Flujo guardado exitosamente',
        });
      }
    } catch (error) {
      // Indicar error con el estado visual y notificación
      setSaveStatus('error');
      setNotification({
        text: `❌ Error al guardar flujo: ${error.message || 'Error desconocido'}`,
        id: Date.now(),
      });

      // También mostrar notificación si la función existe
      if (showNotification) {
        showNotification({
          type: 'error',
          message: `❌ Error al guardar flujo: ${error.message || 'Error desconocido'}`,
        });
      }
    } finally {
      // Dejar de mostrar el indicador de guardando
      setSavingIndicator(false);
    }
  }, [
    propertiesSaveFlow,
    saveFlow,
    showNotification,
    isSaving,
    setSavingIndicator,
    setSaveStatus,
    setNotification,
  ]);

  return {
    handleLogoClick,
    handleSaveFlow,
  };
};

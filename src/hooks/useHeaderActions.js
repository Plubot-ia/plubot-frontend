import { useCallback } from 'react';

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

      // Obtener los nodos reales SOLO cuando se necesitan para validación
      const actualNodes = useFlowStore.getState().nodes;
      const nodesToValidate = actualNodes || [];
      const validation = validateRequiredNodes(nodesToValidate);

      if (!validation.valid) {
        throw new Error(validation.message);
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
      setNotification({
        text: '✅ Flujo guardado exitosamente',
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

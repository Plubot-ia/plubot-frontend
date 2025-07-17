import useSyncService from '@/services/syncService';
import { validateRequiredNodes } from '@/utils/node-validators';

export const useHeaderActions = ({
  onCloseModals,
  closeAllModals,
  nodes,
  propertiesSaveFlow,
  saveFlow,
  isSaving,
  setSavingIndicator,
  setSaveStatus,
  setNotification,
}) => {
  const { syncAllPlubots } = useSyncService();

  const handleLogoClick = () => {
    if (closeAllModals) closeAllModals();
    if (onCloseModals) onCloseModals();
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
    handleLogoClick,
    handleSaveFlow,
  };
};

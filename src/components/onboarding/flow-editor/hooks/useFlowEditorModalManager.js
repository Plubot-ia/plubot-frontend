import { useFlowSaver } from './useFlowSaver';
import { useModalManager } from './useModalManager';
import useNodeStyles from './useNodeStyles';

/**
 * Custom hook para manejar toda la lógica de modal management y flow saver
 * Extrae estas responsabilidades del componente principal FlowEditor
 */
const useFlowEditorModalManager = ({ isUltraMode, plubotId, handleError, setHasChanges }) => {
  // Aplicar estilos de nodos según el modo
  useNodeStyles(isUltraMode);

  // Gestión de modales
  const { openModal, closeModal } = useModalManager();

  // Gestión de guardado de flujo
  const {
    show: showSaveStatus,
    status: saveStatus,
    message: saveMessage,
    saveFlowHandler,
  } = useFlowSaver(plubotId, handleError, setHasChanges);

  return {
    // Modal management
    openModal,
    closeModal,
    // Flow saver
    showSaveStatus,
    saveStatus,
    saveMessage,
    saveFlowHandler,
  };
};

export default useFlowEditorModalManager;

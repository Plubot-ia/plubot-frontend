/**
 * Custom hook para preparar todas las props de FlowEditorRenderer
 * Extrae la preparación masiva de props del componente principal FlowEditor
 */
const useFlowEditorProps = ({
  // Props del header
  flowName,
  setLocalFlowName,
  saveFlowHandler,
  lastSaved,
  openModal,
  // Props del status
  showSaveStatus,
  saveStatus,
  saveMessage,
  // Props de recovery
  isRecoveryOpen,
  handleRecover,
  handleDismiss,
  backupExists,
  // Props del flujo principal
  reactFlowInstance,
  setReactFlowInstance,
  reactFlowWrapperReference,
  nodes,
  edges,
  onNodesChangeOptimized,
  onEdgesChangeOptimized,
  onConnectNodes,
  isValidConnection,
  plubotId,
  name,
  onDragOver,
  onDrop,
  onSelectionDragStop,
  onEdgeUpdate,
  onEdgeUpdateStart,
  onEdgeUpdateEnd,
  isUltraMode,
  closeModal,
  hideContextMenu,
  // Controladores especiales
  ultraModeController,
}) => {
  return {
    // Props del header
    flowName,
    setLocalFlowName,
    saveFlowHandler,
    lastSaved,
    openModal,
    // Props del status
    showSaveStatus,
    saveStatus,
    saveMessage,
    // Props de recovery
    isRecoveryOpen,
    handleRecover,
    handleDismiss,
    backupExists,
    // Props del flujo principal
    reactFlowInstance,
    setReactFlowInstance,
    reactFlowWrapperReference,
    nodes,
    edges,
    onNodesChangeOptimized,
    onEdgesChangeOptimized,
    onConnectNodes,
    isValidConnection,
    plubotId,
    name,
    onDragOver,
    onDrop,
    onSelectionDragStop,
    onEdgeUpdate,
    onEdgeUpdateStart,
    onEdgeUpdateEnd,
    isUltraMode,
    closeModal,
    hideContextMenu,
    // Controladores especiales
    ultraModeController,
  };
};

export default useFlowEditorProps;

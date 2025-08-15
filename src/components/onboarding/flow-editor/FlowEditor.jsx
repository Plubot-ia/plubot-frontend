/**
 * FlowEditor.jsx
 * Componente principal del editor visual de flujos de conversación.
 * Implementa el sistema drag-and-drop con ReactFlow para crear flujos interactivos.
 */

// Third-party libraries
import PropTypes from 'prop-types';
import React, { useEffect, useRef, lazy } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { shallow } from 'zustand/shallow';

// Global components, hooks, stores, and utils
import ContextMenu from '@/components/onboarding/ui/context-menu';
import useAuthStore from '@/stores/use-auth-store';
import useFlowStore from '@/stores/use-flow-store';
import { useRenderTracker } from '@/utils/renderTracker';

// Local components, hooks, and utils
import FlowEditorRenderer from './components/FlowEditorRenderer';
import useFlowEditorEffects from './hooks/useFlowEditorEffects';
import useFlowEditorHandlers from './hooks/useFlowEditorHandlers';
import useFlowEditorManagers from './hooks/useFlowEditorManagers';
import useFlowEditorModalManager from './hooks/useFlowEditorModalManager';
import useFlowEditorState from './hooks/useFlowEditorState';
import useFlowEditorStore from './hooks/useFlowEditorStore';
import EnhancedPerformanceMonitor from './ui/EnhancedPerformanceMonitor';
import '@/utils/globalLogControl'; // Initialize global log control system
import '@/utils/enhancedRenderTracker'; // Initialize enhanced render tracker

// Styles and patches
import './FlowEditor.css';
import './react-flow-overrides.css';
import './ui/PerformancePatch.js';
import './ui/UltraMode.css';
import './ui/ultra-mode-fixes.css';

// Lazy-loaded Modals
// eslint-disable-next-line no-unused-vars -- Used indirectly through modal management system
const EmbedModal = lazy(() => import('../modals/EmbedModal'));
// eslint-disable-next-line no-unused-vars -- Used indirectly through modal management system
const ImportExportModal = lazy(() => import('../modals/ImportExportModal'));
// eslint-disable-next-line no-unused-vars -- Used indirectly through modal management system
const TemplateSelector = lazy(() => import('../modals/TemplateSelector'));

// Lazy-loaded Nodes
// eslint-disable-next-line no-unused-vars -- Node types loaded dynamically by ReactFlow node registry
const ActionNode = lazy(() => import('../nodes/actionnode/ActionNode.jsx'));
// eslint-disable-next-line no-unused-vars -- Node types loaded dynamically by ReactFlow node registry
const AiNode = lazy(() => import('../nodes/ainode/AiNode'));
// eslint-disable-next-line no-unused-vars -- Node types loaded dynamically by ReactFlow node registry
const AiNodePro = lazy(() => import('../nodes/ainodepro/AiNodePro.jsx'));
// eslint-disable-next-line no-unused-vars -- Node types loaded dynamically by ReactFlow node registry
const DecisionNode = lazy(() => import('../nodes/decisionnode/DecisionNode.tsx'));
// eslint-disable-next-line no-unused-vars -- Node types loaded dynamically by ReactFlow node registry
const DiscordNode = lazy(() => import('../nodes/discordnode/DiscordNode.tsx'));
// eslint-disable-next-line no-unused-vars -- Node types loaded dynamically by ReactFlow node registry
const EmotionDetectionNode = lazy(
  () => import('../nodes/emotiondetectionnode/EmotionDetectionNode.jsx'),
);
// eslint-disable-next-line no-unused-vars -- Node types loaded dynamically by ReactFlow node registry
const EndNode = lazy(() => import('../nodes/endnode/EndNode'));
// eslint-disable-next-line no-unused-vars -- Node types loaded dynamically by ReactFlow node registry
const HttpRequestNode = lazy(() => import('../nodes/httprequestnode/HttpRequestNode.jsx'));
// eslint-disable-next-line no-unused-vars -- Node types loaded dynamically by ReactFlow node registry
const MessageNode = lazy(() => import('../nodes/messagenode/MessageNode.tsx'));
// eslint-disable-next-line no-unused-vars -- Node types loaded dynamically by ReactFlow node registry
const OptionNode = lazy(() => import('../nodes/optionnode'));
// eslint-disable-next-line no-unused-vars -- Node types loaded dynamically by ReactFlow node registry
const PowerNode = lazy(() => import('../nodes/powernode/PowerNode.jsx'));

/**
 * Error Boundary para manejar errores de renderizado en componentes de nodos
 * Evita que un error en un nodo cause la caída de toda la aplicación
 */
class NodeErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  state = { hasError: false, error: undefined };

  componentDidCatch(_error, _errorInfo) {
    /* no-op */
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='node-error-container'>
          <div className='node-error-message'>
            <span className='node-error-icon'>⚠️</span>
            <span>Error: {this.state.error?.message || 'Error desconocido'}</span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

NodeErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Componente interno del editor de flujos
 * Maneja toda la lógica principal del editor y coordina los diferentes hooks especializados
 */

const UltraModeController = React.memo(
  ({ _plubotId, backupEdgesToLocalStorage, nodes, edges, debouncedSave }) => {
    // Efecto para el guardado automático en modo Ultra
    useEffect(() => {
      if (debouncedSave) {
        debouncedSave();
      }
      backupEdgesToLocalStorage(edges);
    }, [nodes, edges, debouncedSave, backupEdgesToLocalStorage]);

    // eslint-disable-next-line unicorn/no-null
    return null;
  },
);

UltraModeController.displayName = 'UltraModeController';

UltraModeController.propTypes = {
  _plubotId: PropTypes.string, // Unused parameter, kept for interface consistency
  backupEdgesToLocalStorage: PropTypes.func.isRequired,
  nodes: PropTypes.array.isRequired,
  edges: PropTypes.array.isRequired,
  debouncedSave: PropTypes.func.isRequired,
};

// Helper: Crear controlador de modo ultra
const createUltraModeController = (params) => {
  const { isUltraMode, plubotId, backupEdgesToLocalStorage, nodes, edges, debouncedSave } = params;
  return isUltraMode ? (
    <UltraModeController
      _plubotId={plubotId}
      backupEdgesToLocalStorage={backupEdgesToLocalStorage}
      nodes={nodes}
      edges={edges}
      debouncedSave={debouncedSave}
    />
  ) : undefined;
};

// Helper: Gestionar hooks de estado y efectos
const useFlowEditorHooks = ({ plubotId, name, handleError }) => {
  // Store de Zustand
  const {
    isUltraMode,
    lastSaved,
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    setPlubotId,
    setFlowName: setGlobalFlowName,
    saveLocalBackup,
  } = useFlowEditorStore();

  // Estado local y hooks básicos
  const stateHooks = useFlowEditorState({
    name,
    plubotId,
    nodes,
    edges,
    handleError,
  });

  // Efectos secundarios
  useFlowEditorEffects({
    plubotId,
    name,
    flowName: stateHooks.flowName,
    setPlubotId,
    setLocalFlowName: stateHooks.setLocalFlowName,
    setGlobalFlowName,
    saveLocalBackup,
    hasLocalBackup: stateHooks.hasLocalBackup,
    setBackupExists: stateHooks.setBackupExists,
    setRecoveryOpen: stateHooks.setRecoveryOpen,
  });

  return {
    ...stateHooks,
    isUltraMode,
    lastSaved,
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
  };
};

// Helper: Preparar props del renderizador
const prepareRendererProps = ({
  flowName,
  setLocalFlowName,
  saveFlowHandler,
  lastSaved,
  openModal,
  showSaveStatus,
  saveStatus,
  saveMessage,
  isRecoveryOpen,
  handleRecover,
  handleDismiss,
  backupExists,
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
  ultraModeController,
}) => {
  return {
    flowName,
    setLocalFlowName,
    saveFlowHandler,
    lastSaved,
    openModal,
    showSaveStatus,
    saveStatus,
    saveMessage,
    isRecoveryOpen,
    handleRecover,
    handleDismiss,
    backupExists,
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
    ultraModeController,
  };
};

const FlowEditorInner = React.memo(
  ({
    // Props relacionadas con el flujo y la identificación
    plubotId,
    name,

    // Props para manejo de errores y UI
    handleError,
    hideContextMenu,
  }) => {
    // DEBUG: AGGRESSIVE tracking of FlowEditor renders during drag
    // Render logging temporarily disabled - was causing render cascade
    // console.log('🔥 [FlowEditor] RENDER DETECTED:', {
    //   timestamp: Date.now(),
    //   plubotId,
    //   name,
    //   stackTrace: new Error().stack?.split('\n')[1]?.trim()
    // });

    // 🔄 RENDER TRACKING - Track FlowEditor renders
    useRenderTracker('FlowEditor');

    // Referencias y navegación
    const reactFlowWrapperReference = useRef();

    // ==============================================
    // SECCIÓN 1-3: ESTADO, HOOKS Y EFECTOS
    // ==============================================
    const {
      flowName,
      setLocalFlowName,
      setHasChanges,
      reactFlowInstance,
      setReactFlowInstance,
      isRecoveryOpen,
      setRecoveryOpen,
      backupExists,
      isValidConnection,
      addToHistory,
      createBackup,
      recoverFromBackup,
      debouncedSave,
      isUltraMode,
      lastSaved,
      nodes,
      edges,
      setNodes,
      setEdges,
      onNodesChange,
      onEdgesChange,
    } = useFlowEditorHooks({ plubotId, name, handleError });

    // ==============================================
    // SECCIÓN 4: FUNCIONES Y CALLBACKS
    // ==============================================

    // ==============================================
    // SECCIÓN 3: MANAGERS Y SAVE HISTORY
    // ==============================================
    const { saveHistoryState, onConnectNodes, onDragOver, onDrop } = useFlowEditorManagers({
      addToHistory,
      setHasChanges,
      reactFlowWrapperReference,
      reactFlowInstance,
    });

    // ==============================================
    // SECCIÓN 4: HANDLERS DE EVENTOS
    // ==============================================
    const {
      onNodesChangeOptimized,
      onEdgesChangeOptimized,
      onSelectionDragStop,
      onEdgeUpdate,
      onEdgeUpdateStart,
      onEdgeUpdateEnd,
      handleRecover,
      handleDismiss,
    } = useFlowEditorHandlers({
      onNodesChange,
      onEdgesChange,
      setHasChanges,
      saveHistoryState,
      setEdges,
      recoverFromBackup,
      setNodes,
      setRecoveryOpen,
    });

    // ==============================================;
    // SECCIÓN 5: LÓGICA CONDICIONAL (Ultra Mode)
    // ==============================================;
    const ultraModeController = createUltraModeController({
      isUltraMode,
      plubotId,
      backupEdgesToLocalStorage: createBackup,
      nodes,
      edges,
      debouncedSave,
    });

    // ==============================================
    // SECCIÓN 5: MODAL MANAGEMENT Y FLOW SAVER
    // ==============================================
    const { openModal, closeModal, showSaveStatus, saveStatus, saveMessage, saveFlowHandler } =
      useFlowEditorModalManager({
        isUltraMode,
        plubotId,
        handleError,
        setHasChanges,
      });

    // ==============================================
    // SECCIÓN 6: PREPARACIÓN DE PROPS FINALES
    // ==============================================
    const rendererProps = prepareRendererProps({
      flowName,
      setLocalFlowName,
      saveFlowHandler,
      lastSaved,
      openModal,
      showSaveStatus,
      saveStatus,
      saveMessage,
      isRecoveryOpen,
      handleRecover,
      handleDismiss,
      backupExists,
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
      ultraModeController,
    });

    // ==============================================
    // SECCIÓN 7: RENDERIZADO DEL COMPONENTE
    // ==============================================
    return <FlowEditorRenderer {...rendererProps} />;
  },
);

FlowEditorInner.displayName = 'FlowEditorInner';

FlowEditorInner.propTypes = {
  plubotId: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  handleError: PropTypes.func.isRequired,
  hideContextMenu: PropTypes.func.isRequired,
};

/**
 * Componente principal FlowEditor que envuelve ReactFlowProvider
 * Proporciona un contexto global para ReactFlow y manejo de errores
 */
const FlowEditor = ({
  selectedNode,
  setSelectedNode,
  handleError,
  plubotId,
  name,
  saveFlowData,
  hideHeader = false,
}) => {
  const { isAuthenticated } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
  }));
  const isPublic = false;
  const { contextMenuVisible, contextMenuPosition, contextMenuItems, hideContextMenu } =
    useFlowStore(
      (state) => ({
        contextMenuVisible: state.contextMenuVisible,
        contextMenuPosition: state.contextMenuPosition,
        contextMenuItems: state.contextMenuItems,
        hideContextMenu: state.hideContextMenu,
      }),
      shallow,
    );

  // Si el usuario no está autenticado y no es una vista pública, no renderizar el editor.
  // Esto previene el "flash" del estado por defecto durante la redirección.
  if (!isAuthenticated && !isPublic) {
    // eslint-disable-next-line unicorn/no-null
    return null;
  }

  return (
    <ReactFlowProvider>
      <FlowEditorInner
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        handleError={handleError}
        plubotId={plubotId}
        name={name}
        saveFlowData={saveFlowData}
        hideHeader={hideHeader}
        hideContextMenu={hideContextMenu}
      />
      {/* Global Context Menu Renderer */}
      {contextMenuVisible &&
        contextMenuPosition &&
        contextMenuItems &&
        contextMenuItems.length > 0 && (
          <ContextMenu
            position={contextMenuPosition}
            items={contextMenuItems}
            onClose={hideContextMenu}
          />
        )}

      {/* Real-Time Performance Monitor - Solo en desarrollo */}
      {import.meta.env.DEV && (
        <EnhancedPerformanceMonitor
          updateInterval={3000}
          autoStart={false}
          showRecommendations={false}
          defaultExpandedCategories={['FLOW_NODES']}
        />
      )}
    </ReactFlowProvider>
  );
};

FlowEditor.propTypes = {
  selectedNode: PropTypes.object,
  setSelectedNode: PropTypes.func.isRequired,
  handleError: PropTypes.func.isRequired,
  plubotId: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  saveFlowData: PropTypes.func.isRequired,
  hideHeader: PropTypes.bool,
};

FlowEditor.displayName = 'FlowEditor';

export default FlowEditor;

/**
 * FlowEditor.jsx
 * Componente principal del editor visual de flujos de conversación.
 * Implementa el sistema drag-and-drop con ReactFlow para crear flujos interactivos.
 */

// Third-party libraries
import PropTypes from 'prop-types';
import React, { lazy, useEffect, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { shallow } from 'zustand/shallow';

// Global components, hooks, stores, and utils
import ContextMenu from '@/components/onboarding/ui/context-menu';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import useAuthStore from '@/stores/use-auth-store';
import useFlowStore from '@/stores/use-flow-store';

// Local components, hooks, and utils
import EpicHeader from '../common/EpicHeader';
import StatusBubble from '../common/StatusBubble';

import EmergencyRecovery from './components/EmergencyRecovery';
import FlowMain from './components/FlowMain';
import useConnectionValidator from './hooks/useConnectionValidator';
import useDragAndDropManager from './hooks/useDragAndDropManager';
import { useFlowEvents } from './hooks/useFlowEvents';
import { useFlowSaver } from './hooks/useFlowSaver';
import { useModalManager } from './hooks/useModalManager';
import useNodeStyles from './hooks/useNodeStyles';
import { MIN_ZOOM, NODE_EXTENT, TRANSLATE_EXTENT } from './utils/flow-extents';

// Styles and patches
import './FlowEditor.css';
import './react-flow-overrides.css';
import './ui/PerformancePatch.js';
import './ui/UltraMode.css';
import './ui/ultra-mode-fixes.css';

// Lazy-loaded Modals
const EmbedModal = lazy(() => import('../modals/EmbedModal'));
const ImportExportModal = lazy(() => import('../modals/ImportExportModal'));
const TemplateSelector = lazy(() => import('../modals/TemplateSelector'));

// Lazy-loaded Nodes
const ActionNode = lazy(() => import('../nodes/actionnode/ActionNode.jsx'));
const AiNode = lazy(() => import('../nodes/ainode/AiNode'));
const AiNodePro = lazy(() => import('../nodes/ainodepro/AiNodePro.jsx'));
const DecisionNode = lazy(
  () => import('../nodes/decisionnode/DecisionNode.jsx'),
);
const DiscordNode = lazy(() => import('../nodes/discordnode/DiscordNode.tsx'));
const EmotionDetectionNode = lazy(
  () => import('../nodes/emotiondetectionnode/EmotionDetectionNode.jsx'),
);
const EndNode = lazy(() => import('../nodes/endnode/EndNode'));
const HttpRequestNode = lazy(
  () => import('../nodes/httprequestnode/HttpRequestNode.jsx'),
);
const MessageNode = lazy(() => import('../nodes/messagenode/MessageNode'));
const OptionNode = lazy(() => import('../nodes/optionnode/OptionNode.jsx'));
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
            <span>
              Error: {this.state.error?.message || 'Error desconocido'}
            </span>
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
const FlowEditorInner = ({
  // Props relacionadas con el flujo y la identificación
  plubotId,
  name,

  // Props para manejo de errores y UI
  handleError,
  hideContextMenu,
}) => {
  // ==============================================
  // SECCIÓN 1: ESTADO Y REFERENCIAS
  // ==============================================
  const reactFlowWrapperReference = useRef(null);

  // ==============================================
  // SECCIÓN 2: HOOKS DE ZUSTAND (STORE GLOBAL)
  // ==============================================
  const {
    nodes,
    edges,
    onNodesChange: onNodesChangeOptimized,
    onEdgesChange: onEdgesChangeOptimized,
    setEdges,
    deleteElements,
    flowName,
    isUltraMode,
    reactFlowInstance,
    setReactFlowInstance,
    loadFlow,
    setHasChanges,
  } = useFlowStore(
    (state) => ({
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      setEdges: state.setEdges,
      deleteElements: state.deleteElements,
      flowName: state.name,
      isUltraMode: state.isUltraMode,
      reactFlowInstance: state.reactFlowInstance,
      setReactFlowInstance: state.setReactFlowInstance,
      loadFlow: state.loadFlow,
      setHasChanges: state.setHasChanges,
    }),
    shallow,
  );

  // ==============================================
  // SECCIÓN 3: HOOKS ESPECIALIZADOS LOCALES
  // ==============================================

  // Hook para la gestión de Deshacer/Rehacer
  const { takeSnapshot } = useUndoRedo();

  // Hook para la validación de conexiones
  const { isValidConnection } = useConnectionValidator();

  // Hook para la gestión de eventos de React Flow
  const {
    onConnectNodes,
    onEdgeUpdateStart,
    onEdgeUpdate,
    onEdgeUpdateEnd,
    onSelectionDragStop,
  } = useFlowEvents(isValidConnection, setEdges, deleteElements, takeSnapshot);

  // Hook para la gestión de arrastrar y soltar
  const { onDragOver, onDrop } = useDragAndDropManager(
    reactFlowWrapperReference,
    reactFlowInstance,
  );

  // Hook para la gestión de modales
  const { openModal, closeModal } = useModalManager();

  // Hook para la lógica de guardado, notificaciones y respaldos
  const {
    saveFlowHandler,
    lastSaved,
    saveStatus,
    showSaveStatus,
    saveMessage,
    attemptBackupRecovery,
    isLoaded,
  } = useFlowSaver(plubotId, handleError, setHasChanges);

  // Hook para la gestión de estilos y modos de performance
  useNodeStyles();

  // ==============================================
  // SECCIÓN 4: EFECTOS SECUNDARIOS (useEffect)
  // ==============================================

  // Sincronizar el nombre del plubot con el store global
  useEffect(() => {
    if (name) {
      useFlowStore.setState({ flowName: name });
    }
  }, [name]);

  // Cargar el flujo desde el servidor cuando el componente se monta o el ID cambia
  useEffect(() => {
    if (plubotId) {
      loadFlow(plubotId);
    }
  }, [plubotId, loadFlow]);

  // Intentar recuperación de backup solo si la carga inicial desde el servidor falla o está pendiente
  useEffect(() => {
    if (!isLoaded) {
      attemptBackupRecovery();
    }
  }, [isLoaded, attemptBackupRecovery]);

  // ==============================================
  // SECCIÓN 5: RENDERIZADO DEL COMPONENTE
  // ==============================================
  return (
    <div className='flow-editor-container'>
      <EpicHeader
        title={flowName || 'Flujo sin título'}
        setTitle={(newTitle) => useFlowStore.setState({ flowName: newTitle })}
        showChangeLog={false}
        onSave={saveFlowHandler}
        lastSaved={lastSaved}
        showTemplateSelector={() => openModal('templateSelector')}
        showEmbedModal={() => openModal('embedModal')}
        showOptionsModal={() => openModal('importExportModal')}
        showSimulateModal={() => openModal('simulationModal')}
      />

      {showSaveStatus && (
        <StatusBubble
          status={saveStatus}
          message={saveMessage}
          onClose={() => {
            /* El hook se encarga de ocultarlo */
          }}
        />
      )}

      <div className='flow-main-wrapper' ref={reactFlowWrapperReference}>
        <EmergencyRecovery />

        <FlowMain
          reactFlowInstance={reactFlowInstance}
          setReactFlowInstance={setReactFlowInstance}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeOptimized}
          onEdgesChange={onEdgesChangeOptimized}
          onConnect={onConnectNodes}
          isValidConnection={isValidConnection}
          project={{
            id: plubotId,
            name: flowName || name,
          }}
          onSave={saveFlowHandler}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onSelectionDragStop={onSelectionDragStop}
          onEdgeUpdate={onEdgeUpdate}
          onEdgeUpdateStart={onEdgeUpdateStart}
          onEdgeUpdateEnd={onEdgeUpdateEnd}
          isUltraMode={isUltraMode}
          openModal={openModal}
          closeModal={closeModal}
          nodeExtent={NODE_EXTENT}
          translateExtent={TRANSLATE_EXTENT}
          minZoom={MIN_ZOOM}
          onPaneClick={hideContextMenu}
        />
      </div>
    </div>
  );
};

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
  const isPublic = false; // TODO: Implementar lógica de visibilidad pública

  const {
    contextMenuVisible,
    contextMenuPosition,
    contextMenuItems,
    hideContextMenu,
  } = useFlowStore(
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
    return (
      <div className='flow-editor-unauthenticated'>Cargando sesión...</div>
    );
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

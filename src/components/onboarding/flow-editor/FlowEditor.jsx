/**
 * FlowEditor.jsx
 * Componente principal del editor visual de flujos de conversación.
 * Implementa el sistema drag-and-drop con ReactFlow para crear flujos interactivos.
 */

// Third-party libraries
import PropTypes from 'prop-types';
import React, { lazy, useCallback, useEffect, useRef, useState } from 'react';
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
import useFlowElementsManager from './hooks/useFlowElementsManager';
import { useFlowSaver } from './hooks/useFlowSaver';
import useLocalBackupManager from './hooks/useLocalBackupManager';
import { useModalManager } from './hooks/useModalManager';
import useNodeStyles from './hooks/useNodeStyles';
import { prepareEdgesForSaving } from './utils/edgeFixUtility';
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

const UltraModeController = React.memo(
  ({ plubotId, backupEdgesToLocalStorage, nodes, edges, debouncedSave }) => {
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
  plubotId: PropTypes.string.isRequired,
  backupEdgesToLocalStorage: PropTypes.func.isRequired,
  nodes: PropTypes.array.isRequired,
  edges: PropTypes.array.isRequired,
  debouncedSave: PropTypes.func.isRequired,
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
    // Referencias y navegación
    const reactFlowWrapperReference = useRef();

    // ==============================================
    // SECCIÓN 1: ACCESO AL STORE DE ZUSTAND
    // ==============================================
    const {
      isUltraMode,
      lastSaved,
      setNodes,
      setEdges,
      onNodesChange,
      onEdgesChange,
      setPlubotId,
      setFlowName: setGlobalFlowName,
      saveLocalBackup,
    } = useFlowStore(
      (state) => ({
        isUltraMode: state.isUltraMode,
        lastSaved: state.lastSaved,
        setNodes: state.setNodes,
        setEdges: state.setEdges,
        onNodesChange: state.onNodesChange,
        onEdgesChange: state.onEdgesChange,
        setPlubotId: state.setPlubotId,
        setFlowName: state.setFlowName,
        saveLocalBackup: state.saveLocalBackup,
      }),
      shallow,
    );

    const nodes = useFlowStore((state) => state.nodes);
    const edges = useFlowStore((state) => state.edges);

    // ==============================================
    // SECCIÓN 2: ESTADO LOCAL Y HOOKS BÁSICOS
    // ==============================================
    const [flowName, setLocalFlowName] = useState(name || '');
    const [, setHasChanges] = useState(false);
    const [reactFlowInstance, setReactFlowInstance] = useState();

    // Estado para la recuperación de emergencia
    const [isRecoveryOpen, setRecoveryOpen] = useState(false);
    const [backupExists, setBackupExists] = useState(false);

    const { isValidConnection } = useConnectionValidator(nodes, edges);

    const { addToHistory } = useUndoRedo();

    // Hook para gestionar respaldos locales
    const { createBackup, recoverFromBackup, hasLocalBackup } =
      useLocalBackupManager(plubotId);

    const { debouncedSave } = useFlowSaver(
      plubotId,
      handleError,
      setHasChanges,
    );

    // ==============================================
    // SECCIÓN 3: EFECTOS SECUNDARIOS (useEffect)
    // ==============================================

    // Sincronizar datos con el store global cuando cambia el ID o nombre
    useEffect(() => {
      if (plubotId) {
        setPlubotId(plubotId);
      }
      if (flowName !== name && name) {
        setLocalFlowName(name);
        setGlobalFlowName(name);
      }
    }, [plubotId, name, flowName, setPlubotId, setGlobalFlowName]);

    // Guardado automático de respaldo al cerrar la pestaña
    useEffect(() => {
      const handleBeforeUnload = () => saveLocalBackup();
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () =>
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [saveLocalBackup]);

    // Comprobar si existe un respaldo al montar el componente
    useEffect(() => {
      if (hasLocalBackup()) {
        setBackupExists(true);
        setRecoveryOpen(true);
      }
    }, [hasLocalBackup]); // Se ejecuta si la función de backup cambia

    // ==============================================
    // SECCIÓN 4: FUNCIONES Y CALLBACKS
    // ==============================================

    const saveHistoryState = useCallback(() => {
      const flowState = {
        nodes: useFlowStore.getState().nodes,
        edges: useFlowStore.getState().edges,
      };
      addToHistory(flowState);
    }, [addToHistory]);

    const { onConnectNodes } = useFlowElementsManager(
      saveHistoryState,
      setHasChanges,
    );

    const { onDragOver, onDrop } = useDragAndDropManager(
      reactFlowWrapperReference,
      reactFlowInstance,
      setHasChanges,
    );

    // ==============================================;
    // SECCIÓN 5: LÓGICA CONDICIONAL (Ultra Mode)
    // ==============================================;

    // Extraemos la lógica condicional a un componente separado para no violar las reglas de los hooks.
    // El componente solo se renderiza si isUltraMode es true.
    const ultraModeController = isUltraMode ? (
      <UltraModeController
        plubotId={plubotId}
        backupEdgesToLocalStorage={createBackup} // <-- Pasar la función correcta
        nodes={nodes}
        edges={edges}
        debouncedSave={debouncedSave}
      />
    ) : // eslint-disable-next-line unicorn/no-null
    null;

    useNodeStyles(isUltraMode);

    const { openModal, closeModal } = useModalManager();

    const {
      show: showSaveStatus,
      status: saveStatus,
      message: saveMessage,
      saveFlowHandler,
    } = useFlowSaver(plubotId, handleError, setHasChanges);

    const onNodesChangeOptimized = useCallback(
      (changes) => {
        onNodesChange(changes);
        setHasChanges(true);
      },
      [onNodesChange],
    );

    const onEdgesChangeOptimized = useCallback(
      (changes) => {
        onEdgesChange(changes);
        setHasChanges(true);
      },
      [onEdgesChange],
    );

    const onSelectionDragStop = useCallback(() => {
      saveHistoryState();
      setHasChanges(true);
    }, [saveHistoryState]);

    const onEdgeUpdate = useCallback(
      (oldEdge, newConnection) => {
        saveHistoryState();

        setEdges((currentEdges) => {
          const filtered = currentEdges.filter(
            (edge) => edge.id !== oldEdge.id,
          );
          const newEdge = {
            ...newConnection,
            id: `e-${newConnection.source}-${newConnection.target}-${Date.now()}`,
            type: oldEdge.type || 'elite-edge',
            animated: oldEdge.animated || false,
            data: oldEdge.data || { text: '' },
          };
          return [...filtered, newEdge];
        });

        setHasChanges(true);
      },
      [setEdges, saveHistoryState],
    );

    const [edgeUpdateSuccessful, setEdgeUpdateSuccessful] = useState(false);

    const onEdgeUpdateStart = useCallback(() => {
      setEdgeUpdateSuccessful(false);
    }, []);

    const onEdgeUpdateEnd = useCallback(
      (_event, edge) => {
        if (!edgeUpdateSuccessful) {
          setEdges((currentEdges) =>
            currentEdges.filter((currentEdge) => currentEdge.id !== edge.id),
          );
        }
      },
      [edgeUpdateSuccessful, setEdges],
    );

    // Handlers para el diálogo de recuperación
    const handleRecover = useCallback(() => {
      const backup = recoverFromBackup();
      if (backup && backup.nodes && backup.edges) {
        setNodes(backup.nodes);
        setEdges(prepareEdgesForSaving(backup.edges)); // Asegurar compatibilidad
      }
      setRecoveryOpen(false);
    }, [recoverFromBackup, setNodes, setEdges, setRecoveryOpen]);

    const handleDismiss = useCallback(() => {
      setRecoveryOpen(false);
    }, [setRecoveryOpen]);

    // ==============================================
    // SECCIÓN 5: RENDERIZADO DEL COMPONENTE
    // ==============================================
    return (
      <div className='flow-editor-container'>
        <EpicHeader
          title={flowName || 'Flujo sin título'}
          setTitle={setLocalFlowName}
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

        {ultraModeController}

        <div className='flow-main-wrapper' ref={reactFlowWrapperReference}>
          <EmergencyRecovery
            isOpen={isRecoveryOpen}
            onRecover={handleRecover}
            onDismiss={handleDismiss}
            hasBackup={backupExists}
          />

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

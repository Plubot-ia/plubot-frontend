/**
 * FlowEditor.jsx
 * Componente principal del editor visual de flujos de conversación
 * Implementa el sistema drag-and-drop con ReactFlow para crear flujos interactivos
 */

import React, { useState, useCallback, useRef, useEffect, lazy } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { shallow } from 'zustand/shallow';

import useAuthStore from '@/stores/use-auth-store';
import useFlowStore from '@/stores/use-flow-store';

// Hooks del core de la aplicación

// Hooks especializados del editor de flujos

// Utilidades y configuración

// Importar definiciones de límites para el canvas y los nodos

// Importar utilidad para corregir posicionamiento de nodos durante drag & drop

// Importar gestor de almacenamiento seguro para evitar errores de cuota excedida

// Componentes de UI

import { onEvent } from '@/utils/event-bus.js';

import EpicHeader from '../common/EpicHeader';
import StatusBubble from '../common/StatusBubble';

// Modales - Carga diferida para optimizar el tiempo de carga inicial

const EmbedModal = lazy(() => import('../modals/EmbedModal'));
const ImportExportModal = lazy(() => import('../modals/ImportExportModal'));
const TemplateSelector = lazy(() => import('../modals/TemplateSelector'));

// Nodos - StartNode se importa directamente por ser crítico para el renderizado inicial

import EmergencyRecovery from './components/EmergencyRecovery';
import FlowMain from './components/FlowMain';
import useDragAndDropManager from './hooks/useDragAndDropManager';

// Nodos - El resto se carga bajo demanda para optimizar el tiempo de carga
const EndNode = lazy(() => import('../nodes/endnode/EndNode'));
const MessageNode = lazy(() => import('../nodes/messagenode/MessageNode'));
const DecisionNode = lazy(
  () => import('../nodes/decisionnode/DecisionNode.jsx'),
);
const ActionNode = lazy(() => import('../nodes/actionnode/ActionNode.jsx'));
const OptionNode = lazy(() => import('../nodes/optionnode/OptionNode.jsx'));
const HttpRequestNode = lazy(
  () => import('../nodes/httprequestnode/HttpRequestNode.jsx'),
);
const PowerNode = lazy(() => import('../nodes/powernode/PowerNode.jsx'));
const DiscordNode = lazy(() => import('../nodes/discordnode/DiscordNode.tsx'));
const AiNode = lazy(() => import('../nodes/ainode/AiNode')); // Import for the new AI Node
const AiNodePro = lazy(() => import('../nodes/ainodepro'));
const EmotionDetectionNode = lazy(
  () => import('../nodes/emotiondetectionnode'),
);

// Estilos
import './FlowEditor.css';
import './ui/UltraMode.css';
import './ui/ultra-mode-fixes.css'; // Solución para barras de desplazamiento en Modo Ultra
import './react-flow-overrides.css'; // Consolidated overrides for staging
import './ui/PerformancePatch.js';

import useConnectionValidator from './hooks/useConnectionValidator';
import useFlowElementsManager from './hooks/useFlowElementsManager';
import useLocalBackupManager from './hooks/useLocalBackupManager';
import useNodeStyles from './hooks/useNodeStyles';
import { prepareEdgesForSaving } from './utils/edgeFixUtil';
import {
  NODE_EXTENT,
  TRANSLATE_EXTENT,
  MIN_ZOOM,
  MAX_ZOOM,
} from './utils/flow-extents';
import { applyNodeVisibilityFix } from './utils/optimized-flow-fixes';
import {
  safeSetItem,
  safeGetItem,
  cleanupStorage,
} from './utils/storage-manager';

import ContextMenu from '@/components/onboarding/ui/context-menu';
import {
  createNodeTypes,
  edgeTypes as sharedEdgeTypes,
} from '@/flow/nodeRegistry.jsx';
import useAPI from '@/hooks/useAPI';

import { useUndoRedo } from '@/hooks/useUndoRedo';

/**
 * Error Boundary para manejar errores de renderizado en componentes de nodos
 * Evita que un error en un nodo cause la caída de toda la aplicación
 */
class NodeErrorBoundary extends React.Component {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {}

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

/**
 * Componente interno del editor de flujos
 * Maneja toda la lógica principal del editor y coordina los diferentes hooks especializados
 */
const FlowEditorInner = ({
  // Props relacionadas con el flujo y la identificación
  plubotId,
  name,
  saveFlowData,

  // Props relacionadas con la interacción y selección
  selectedNode,
  setSelectedNode,

  // Props para gestión de conexiones
  setShowConnectionEditor,
  setSelectedConnection,
  setConnectionProperties,

  // Props para simulación y notificaciones
  notifyByte,
  setByteMessage,

  // Props para manejo de errores y UI
  handleError,
  hideHeader = false,
  hideContextMenu,
}) => {
  // Referencias y navegación
  const reactFlowWrapperReference = useRef();

  // ==============================================
  // SECCIÓN 1: ACCESO AL STORE DE ZUSTAND
  // ==============================================

  // Acceso a los datos del store (PRIMERO para evitar redeclaraciones)
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const isUltraMode = useFlowStore((state) => state.isUltraMode);
  const lastSaved = useFlowStore((state) => state.lastSaved);

  // Acceso a las funciones de Zustand
  const {
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    setPlubotId,
    setFlowName,
    toggleUltraMode,
    undo,
    redo,
    saveFlow,
  } = useFlowStore(
    (state) => ({
      setNodes: state.setNodes,
      setEdges: state.setEdges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      setPlubotId: state.setPlubotId,
      setFlowName: state.setFlowName,
      toggleUltraMode: state.toggleUltraMode,
      undo: state.undo,
      redo: state.redo,
      saveFlow: state.saveFlow,
    }),
    shallow,
  );

  // ==============================================
  // SECCIÓN 2: ESTADO LOCAL Y HOOKS BÁSICOS
  // ==============================================

  // Estado básico para identificación y seguimiento
  const [flowName, setLocalFlowName] = useState(name || '');

  // Sistema de modales - DESACTIVADO (ahora gestionado por GlobalProvider)

  // Sistema de notificaciones para feedback al usuario
  const [byteStatus, setByteStatus] = useState('success');
  const [showByte, setShowByte] = useState(false);

  // Estado para respaldo, cambios y recuperación
  const [isBackupLoaded, setBackupLoaded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Hook para la validación de conexiones
  const { isValidConnection } = useConnectionValidator(nodes, edges);

  // Estado de la instancia de ReactFlow
  const [reactFlowInstance, setReactFlowInstance] = useState();

  // Historial global a través del hook unificado
  const {
    addToHistory,
    undo: historyUndo,
    redo: historyRedo,
    canUndo,
    canRedo,
  } = useUndoRedo();

  const saveLocalBackup = useFlowStore((state) => state.saveLocalBackup);

  // Guardado automático de respaldo al cerrar la pestaña para prevenir pérdida de datos.
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveLocalBackup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveLocalBackup]);

  // ==============================================
  // SECCIÓN 3: FUNCIONES MEMOIZADAS (CALLBACKS)
  // ==============================================

  // Función para guardar el estado actual en el historial
  const saveHistoryState = useCallback(() => {
    const flowState = {
      nodes: useFlowStore.getState().nodes,
      edges: useFlowStore.getState().edges,
    };
    addToHistory(flowState);
  }, [addToHistory]);

  // ==============================================
  // SECCIÓN 4: HOOKS PERSONALIZADOS DE LÓGICA
  // ==============================================

  // Hook para gestionar la manipulación de nodos y aristas
  const {
    addNodeToFlow,
    deleteNode,
    duplicateNode,
    deleteEdge,
    updateEdgeData,
    onConnectNodes,
  } = useFlowElementsManager(saveHistoryState, setHasChanges);

  // Hook para gestionar respaldos locales
  const { createBackup, recoverFromBackup } = useLocalBackupManager(plubotId);

  // Hook para arrastrar y soltar nodos desde la paleta
  const { onDragOver, onDrop } = useDragAndDropManager(
    reactFlowWrapperReference,
    reactFlowInstance,
    setHasChanges,
  );

  // Obtener estilos una sola vez por render (hook debe ir a nivel superior)
  const nodeStyles = useNodeStyles(isUltraMode);

  // La gestión de nodeTypes se ha centralizado en FlowMain.jsx para garantizar una referencia estable.

  // La gestión de edgeTypes se ha centralizado en FlowMain.jsx.

  // ==============================================
  // SECCIÓN 5: FUNCIONES Y CALLBACKS (RESTO)
  // ==============================================

  // ==============================================
  // SECCIÓN 4: FUNCIONES Y CALLBACKS
  // ==============================================

  // Función para alternar el modo de rendimiento
  const togglePerformanceMode = useCallback(() => {
    toggleUltraMode();
  }, [toggleUltraMode]);

  // Función para abrir modales (redirige al sistema global)
  const openModal = useCallback((modalName) => {
    // Usar el sistema global en su lugar
    if (typeof globalThis.openModal === 'function') {
      globalThis.openModal(modalName);
    } else {
      // Como respaldo, emitir un evento personalizado
      try {
        globalThis.dispatchEvent(
          new CustomEvent('open-modal', {
            detail: { modal: modalName, timestamp: Date.now() },
          }),
        );
      } catch {}
    }
  }, []);

  // Función para cerrar modales (redirige al sistema global)
  const closeModal = useCallback((modalName) => {
    // Usar el sistema global en su lugar
    if (typeof globalThis.closeModal === 'function') {
      globalThis.closeModal(modalName);
    } else {
      // Como respaldo, emitir un evento personalizado
      try {
        globalThis.dispatchEvent(
          new CustomEvent('close-modal', {
            detail: { modal: modalName, timestamp: Date.now() },
          }),
        );
      } catch {}
    }
  }, []);

  // Función mejorada para guardar el flujo usando Zustand
  const handleSaveFlow = useCallback(async () => {
    if (!plubotId) {
      return;
    }

    try {
      setByteStatus('warning');
      setByteMessage('Guardando cambios...');
      setShowByte(true);

      // Preparar aristas para guardar (asegura que estén visibles)
      const preparedEdges = prepareEdgesForSaving(edges);

      // Usar la función del store para guardar
      const result = await saveFlow();

      if (result && result.success) {
        // Actualizar estado local después de guardar
        setHasChanges(false);
        setByteStatus('success');
        setByteMessage('Cambios guardados correctamente');
      } else {
        // Manejar error
        setByteStatus('error');
        setByteMessage(result?.message || 'Error al guardar los cambios');
        // Crear respaldo local en caso de error
        createBackup(nodes, preparedEdges);
      }
    } catch (error) {
      setByteStatus('error');
      setByteMessage(
        `Error al guardar: ${error.message || 'Error desconocido'}`,
      );
      handleError && handleError(error);

      // Crear respaldo local en caso de error
      createBackup(nodes, edges);
    }
  }, [
    plubotId,
    nodes,
    edges,
    saveFlow,
    setByteMessage,
    createBackup,
    handleError,
    setByteStatus,
    setShowByte,
  ]);

  // Funciones para mantener el historial (complementando Zustand)
  // historyUndo y historyRedo provienen del hook useUndoRedo

  // Funciones optimizadas para actualizar el store
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

  // La gestión de conexiones se centraliza en useFlowElementsManager y se pasa a FlowMain como onConnectNodes

  // Función para alternar animaciones en las aristas
  const toggleEdgeAnimations = useCallback(
    (animate) => {
      setEdges(
        edges.map((edge) => ({
          ...edge,
          animated: animate,
        })),
      );
    },
    [edges, setEdges],
  );

  // Interacciones del usuario con el editor (drag&drop, clicks, etc.)
  const onNodeDragStop = useCallback(
    (event, node) => {
      const positionChange = {
        id: node.id,
        type: 'position',
        position: node.position,
        dragging: false, // Indicar que el arrastre ha finalizado
      };
      onNodesChange([positionChange]); // Actualizar el store con la función correcta
      saveHistoryState(); // Guardar el estado en el historial (usa get() internamente)
      setHasChanges(true);
    },
    [onNodesChange, saveHistoryState, setHasChanges],
  );

  const onSelectionDragStop = useCallback(
    (event, selectedNodes) => {
      const changes = selectedNodes.map((node) => ({
        id: node.id,
        type: 'position',
        position: node.position,
        dragging: false,
      }));
      onNodesChange(changes); // Actualizar el store con la función correcta
      saveHistoryState(); // Guardar el estado en el historial
      setHasChanges(true);
    },
    [onNodesChange, saveHistoryState, setHasChanges],
  );

  const onEdgeClick = useCallback(
    (event, edge) => {
      // Mostrar editor de conexiones y establecer conexión seleccionada
      setShowConnectionEditor(true);
      setSelectedConnection(edge);

      if (edge.data) {
        setConnectionProperties(edge.data);
      } else {
        setConnectionProperties({ text: '' });
      }
    },
    [setShowConnectionEditor, setSelectedConnection, setConnectionProperties],
  );

  const onEdgeUpdate = useCallback(
    (oldEdge, newConnection) => {
      saveHistoryState();

      setEdges((currentEdges) => {
        const filtered = currentEdges.filter((e) => e.id !== oldEdge.id);
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
    [setEdges, saveHistoryState, setHasChanges],
  );

  // Variables para el estado de actualización de aristas
  const [edgeUpdateSuccessful, setEdgeUpdateSuccessful] = useState(false);

  const onEdgeUpdateStart = useCallback(() => {
    setEdgeUpdateSuccessful(false);
  }, []);

  const onEdgeUpdateEnd = useCallback(
    (_, edge) => {
      if (!edgeUpdateSuccessful) {
        setEdges(edges.filter((e) => e.id !== edge.id));
        setHasChanges(true);
      }
    },
    [edgeUpdateSuccessful, edges, setEdges],
  );

  // Función para manejar mensajes de byte (sistema de notificaciones)
  const handleByteMessage = useCallback(
    (event) => {
      const { message, status } = event.detail;

      setByteStatus(status || 'success');
      setByteMessage(message);
      setShowByte(true);
    },
    [setByteStatus, setByteMessage],
  );

  // ==============================================
  // SECCIÓN 5: EFECTOS SECUNDARIOS
  // ==============================================

  // Sincronizar datos con el store global cuando cambia el ID o nombre
  useEffect(() => {
    if (plubotId) {
      setPlubotId(plubotId); // Corregido: usar la acción del store directamente
    }

    if (flowName !== name && name) {
      setLocalFlowName(name);
      setFlowName(name);
    }
  }, [plubotId, name, flowName, setPlubotId, setFlowName]); // Corregido: dependencia actualizada

  // Sincronizar nodos con cambios externos si es necesario
  useEffect(() => {
    if (!isBackupLoaded && plubotId) {
      // Intentar recuperar un respaldo si existe
      const backup = recoverFromBackup();

      if (backup && backup.nodes && backup.edges) {
        setNodes(backup.nodes);
        setEdges(backup.edges);
        setBackupLoaded(true);
      }
    }
  }, [plubotId, isBackupLoaded, setNodes, setEdges, recoverFromBackup]);

  // Configurar listeners para mensajes de byte
  useEffect(() => {
    onEvent('byteMessage', handleByteMessage);

    return () => {
      // Limpiar listener al desmontar
      document.removeEventListener('byteMessage', handleByteMessage);
    };
  }, [handleByteMessage]);

  // Ajustar la vista cuando la instancia de ReactFlow esté lista o los nodos cambien
  // useEffect(() => {
  //   if (reactFlowInstance && nodes && nodes.length > 0) {
  //     // Usar un setTimeout para dar tiempo al DOM a renderizar los nodos completamente
  //     // antes de ajustar la vista. Esto es especialmente útil al cargar flujos.
  //     const timer = setTimeout(() => {
  //       reactFlowInstance.fitView({ padding: 0.1, includeHiddenNodes: false });

  //     }, 100); // Un pequeño delay puede ser suficiente

  //     return () => clearTimeout(timer); // Limpiar el timer si el componente se desmonta o las dependencias cambian
  //   }
  // }, [reactFlowInstance, nodes]); // Dependencias: la instancia y los nodos

  // ==============================================
  // SECCIÓN 6: RENDERIZADO DEL COMPONENTE
  // ==============================================
  return (
    <div className='flow-editor-container'>
      {/* Siempre mostrar EpicHeader en el editor de flujos */}
      <EpicHeader
        title={flowName || 'Flujo sin título'}
        setTitle={setLocalFlowName}
        showChangeLog={false}
        onSave={handleSaveFlow}
        lastSaved={lastSaved}
        showTemplateSelector={() => openModal('templateSelector')}
        showEmbedModal={() => openModal('embedModal')}
        showOptionsModal={() => openModal('importExportModal')}
        showSimulateModal={() => openModal('simulationModal')}
      />

      {showByte && (
        <StatusBubble
          status={byteStatus}
          message={notifyByte || 'Acción completada'}
          onClose={() => setShowByte(false)}
        />
      )}

      <div className='flow-main-wrapper' ref={reactFlowWrapperReference}>
        {/* Componente de recuperación de emergencia - aparecerá solo cuando sea necesario */}
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
          onSave={handleSaveFlow}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onSelectionDragStop={onSelectionDragStop}
          onEdgeUpdate={onEdgeUpdate}
          onEdgeUpdateStart={onEdgeUpdateStart}
          onEdgeUpdateEnd={onEdgeUpdateEnd}
          isUltraMode={isUltraMode}
          // Funciones para modales
          openModal={openModal}
          closeModal={closeModal}
          // Usar las constantes definidas para límites del canvas y nodos
          nodeExtent={NODE_EXTENT}
          translateExtent={TRANSLATE_EXTENT}
          minZoom={MIN_ZOOM}
          onPaneClick={hideContextMenu}
        />

        {/* MODALES DESACTIVADOS: Ahora gestionados exclusivamente por GlobalProvider */}
        {/* Los modales ya no se renderizan aquí, sino en el ModalContainer centralizado */}
      </div>
    </div>
  );
};

/**
 * Componente principal FlowEditor que envuelve ReactFlowProvider
 * Proporciona un contexto global para ReactFlow y manejo de errores
 */
const FlowEditor = ({
  selectedNode,
  setSelectedNode,
  setByteMessage,
  setShowConnectionEditor,
  setSelectedConnection,
  setConnectionProperties,
  handleError,
  plubotId,
  name,
  notifyByte,
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
        setByteMessage={setByteMessage}
        setShowConnectionEditor={setShowConnectionEditor}
        setSelectedConnection={setSelectedConnection}
        setConnectionProperties={setConnectionProperties}
        handleError={handleError}
        plubotId={plubotId}
        name={name}
        notifyByte={notifyByte}
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

FlowEditor.displayName = 'FlowEditor';

export default FlowEditor;

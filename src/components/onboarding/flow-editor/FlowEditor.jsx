/**
 * FlowEditor.jsx
 * Componente principal del editor visual de flujos de conversación
 * Implementa el sistema drag-and-drop con ReactFlow para crear flujos interactivos
 */

import React, { useState, useCallback, useRef, useMemo, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import { ReactFlowProvider, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';

// Hooks del core de la aplicación
import useFlowStore from '@/stores/useFlowStore';
import useAPI from '@/hooks/useAPI';
import ContextMenu from '@/components/onboarding/ui/context-menu';
import { shallow } from 'zustand/shallow';

// Hooks especializados del editor de flujos
import useNodeStyles from './hooks/useNodeStyles';
import useDragAndDropManager from './hooks/useDragAndDropManager';

// Utilidades y configuración
import { NODE_TYPES, NODE_LABELS } from '@/utils/nodeConfig';
import { onEvent } from '@/utils/eventBus';
import { applyNodeVisibilityFix } from './utils/optimized-flow-fixes';
import { 
  prepareEdgesForSaving, 
  recoverEdgesFromLocalStorage, 
  backupEdgesToLocalStorage 
} from './utils/edgeFixUtil';

// Importar definiciones de límites para el canvas y los nodos
import { NODE_EXTENT, TRANSLATE_EXTENT, MIN_ZOOM, MAX_ZOOM } from './utils/flow-extents';

// Importar utilidad para corregir posicionamiento de nodos durante drag & drop
import { calculateCorrectDropPosition, getViewportCenterPosition } from './drop-position-fix';

// Importar gestor de almacenamiento seguro para evitar errores de cuota excedida
import { safeSetItem, safeGetItem, cleanupStorage } from './utils/storage-manager';

// Componentes de UI
import EpicHeader from '../common/EpicHeader';
import StatusBubble from '../common/StatusBubble';
import FlowMain from './components/FlowMain';
import EmergencyRecovery from './components/EmergencyRecovery';

// Modales - Carga diferida para optimizar el tiempo de carga inicial
const SimulationInterface = lazy(() => import('../simulation/SimulationInterface'));
const EmbedModal = lazy(() => import('../modals/EmbedModal'));
const ImportExportModal = lazy(() => import('../modals/ImportExportModal'));
const TemplateSelector = lazy(() => import('../modals/TemplateSelector'));

// Nodos - StartNode se importa directamente por ser crítico para el renderizado inicial
import StartNode from '../nodes/startnode';
import EliteEdge from './ui/EliteEdge.jsx'; // Added import for EliteEdge

// Nodos - El resto se carga bajo demanda para optimizar el tiempo de carga
const EndNode = lazy(() => import('../nodes/endnode/EndNode'));
const MessageNode = lazy(() => import('../nodes/messagenode/MessageNode'));
const DecisionNode = lazy(() => import('../nodes/decisionnode/DecisionNode.jsx'));
const ActionNode = lazy(() => import('../nodes/actionnode/ActionNode.jsx'));
const OptionNode = lazy(() => import('../nodes/optionnode/OptionNode.jsx'));
const HttpRequestNode = lazy(() => import('../nodes/httprequestnode/HttpRequestNode.jsx'));
const PowerNode = lazy(() => import('../nodes/powernode/PowerNode.jsx'));
const DiscordNode = lazy(() => import('../nodes/discordnode/DiscordNode.tsx'));
const AiNode = lazy(() => import('../nodes/ainode/AiNode')); // Import for the new AI Node
const AiNodePro = lazy(() => import('../nodes/ainodepro'));
const EmotionDetectionNode = lazy(() => import('../nodes/emotiondetectionnode'));

// Estilos
import './FlowEditor.css';
import './ui/UltraMode.css';
import './ui/ultra-mode-fixes.css'; // Solución para barras de desplazamiento en Modo Ultra
import './react-flow-overrides.css'; // Consolidated overrides for staging
import './ui/PerformancePatch.js';

import { createNodeTypes, edgeTypes as sharedEdgeTypes } from '@/flow/nodeRegistry.jsx';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import useFlowElementsManager from './hooks/useFlowElementsManager';
import useLocalBackupManager from './hooks/useLocalBackupManager';

/**
 * Hook personalizado para definir y gestionar los tipos de nodos en ReactFlow
 * @param {boolean} isUltraPerformanceMode - Indica si el modo de rendimiento optimizado está activado
 * @returns {Object} - Objeto con los tipos de nodos configurados para ReactFlow
 */
const useNodeTypes = (isUltraPerformanceMode = false) => {
  // Obtener estilos una sola vez por render (hook debe ir a nivel superior)
  const nodeStyles = useNodeStyles(isUltraPerformanceMode);
  
  // Acceso seguro a funciones del store global
  const getSafeStoreFunction = useCallback((functionName) => {
    try {
      const storeFunction = useFlowStore.getState()[functionName];
      if (typeof storeFunction === 'function') {
        return storeFunction;
      }
      return () => console.warn(`Function ${functionName} not found in store`);
    } catch (e) {
      console.error(`Error accessing ${functionName} from store:`, e);
      return () => {};
    }
  }, []);
  
  // Tipos de nodos con optimización de rendimiento
  return useMemo(() => {
    // Obtener las funciones necesarias del store
    const {
      onNodesChange: storeOnNodesChange,
      setNodes: storeSetNodes,
      setEdges: storeSetEdges,
      isUltraMode: storeIsUltraMode
    } = useFlowStore.getState();

    // Factory para crear renderizadores de nodos con todas las props requeridas
    const createNodeRenderer = (WrapperComponent) => (props) => {
      return (
        <NodeErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            <WrapperComponent 
              {...props} 
              styles={nodeStyles}
              onNodesChange={storeOnNodesChange} 
              setNodes={storeSetNodes}
              setEdges={storeSetEdges}
              isUltraPerformanceMode={storeIsUltraMode} 
            />
          </Suspense>
        </NodeErrorBoundary>
      );
    };
    
    // Configuración de tipos de nodos para ReactFlow
    // IMPORTANTE: Los nombres de los tipos DEBEN coincidir exactamente con los
    // strings utilizados como 'type' en los objetos de nodo
    return {
      start: createNodeRenderer(StartNode),
      end: createNodeRenderer(EndNode),
      message: createNodeRenderer(MessageNode),
      decision: createNodeRenderer(DecisionNode),
      action: createNodeRenderer(ActionNode),
      option: createNodeRenderer(OptionNode),
      httpRequest: createNodeRenderer(HttpRequestNode),
      power: createNodeRenderer(PowerNode),
      discord: createNodeRenderer(DiscordNode), // Registered DiscordNode
      ai: createNodeRenderer(AiNode), // Registered AiNode
      aiNodePro: createNodeRenderer(AiNodePro),
      emotionDetection: createNodeRenderer(EmotionDetectionNode),
    };
  }, [nodeStyles]);
};

/**
 * Hook para definir los tipos de aristas disponibles en el editor
 * Utiliza EliteEdge como componente base para todas las variantes
 * @returns {Object} - Configuración de aristas para ReactFlow
 */
const useEdgeTypes = () => {
  // Factory que genera variantes de EliteEdge con diferentes estilos
  const createEdgeVariant = useCallback((type = 'default') => {
    return (props) => <EliteEdge {...props} variant={type} />;
  }, []);
  
  // Configuración de tipos de aristas para ReactFlow
  return useMemo(() => ({
    'elite-edge': createEdgeVariant('default'),
    'success-edge': createEdgeVariant('success'),
    'warning-edge': createEdgeVariant('warning'),
    'error-edge': createEdgeVariant('error'),
    'custom-edge': createEdgeVariant('custom')
  }), [createEdgeVariant]);
};

/**
 * Hook personalizado para validar conexiones entre nodos
 * Define reglas para determinar qué tipos de nodos pueden conectarse entre sí
 * @param {Array} nodes - Lista de nodos en el flujo
 * @returns {Object} - Funciones y configuración para validar conexiones
 */
const useHandleValidator = (nodes, edges) => {
  // Mapa de conexiones válidas por tipo de nodo
  const validConnections = useMemo(() => ({
    // Nodo de inicio solo puede conectarse a nodos de mensaje, decisión o acción
    start: ['message', 'decision', 'action', 'httpRequest', 'power', 'discord', 'ai', 'aiNodePro', 'emotionDetection'], 
    
    // Nodo de mensaje puede conectarse a cualquier tipo excepto a sí mismo
    message: ['message', 'end', 'decision', 'action', 'option', 'httpRequest', 'power', 'discord', 'ai', 'aiNodePro', 'emotionDetection'], 
    
    // Nodo de decisión puede conectarse a cualquier tipo excepto inicio
    decision: ['message', 'end', 'action', 'option', 'httpRequest', 'power', 'discord', 'ai', 'aiNodePro'],
    
    // Nodo de acción puede conectarse a cualquier tipo excepto inicio
    action: ['message', 'end', 'decision', 'option', 'httpRequest', 'power', 'discord', 'ai', 'aiNodePro'],
    
    // Nodo de opción puede conectarse a nodos de mensaje, decisión o acción
    option: ['message', 'decision', 'action', 'httpRequest', 'end', 'ai', 'aiNodePro'],
    
    // Nodo HTTP puede conectarse a nodos de mensaje, decisión o acción
    httpRequest: ['message', 'decision', 'action', 'end', 'option', 'power', 'discord', 'ai', 'aiNodePro'],
    
    // Nodo especial puede conectarse a cualquier tipo excepto inicio
    power: ['message', 'end', 'decision', 'action', 'option', 'httpRequest', 'discord', 'ai', 'aiNodePro'],
    
    // Nodo Discord: Puede conectarse a la mayoría y recibir de la mayoría
    discord: ['message', 'end', 'decision', 'action', 'option', 'httpRequest', 'power', 'discord', 'ai', 'aiNodePro'],

    // Nodo AI: Puede conectarse a la mayoría y recibir de la mayoría (excepto start)
    ai: ['message', 'decision', 'action', 'end', 'httpRequest', 'power', 'discord', 'ai', 'aiNodePro', 'emotionDetection'],

    // Nodo AI Pro: Mismas reglas que el nodo AI normal
    aiNodePro: ['message', 'decision', 'action', 'end', 'httpRequest', 'power', 'discord', 'ai', 'aiNodePro', 'emotionDetection'],

    // Nodo de Detección de Emociones: Puede conectarse a la mayoría de nodos.
    emotionDetection: ['message', 'end', 'decision', 'action', 'option', 'httpRequest', 'power', 'discord', 'ai', 'aiNodePro'],

    // Nodo final no puede conectarse a ningún otro nodo
    end: []
  }), []);
  
  // Función para validar si una conexión entre handles es válida
  const validConnectionsHandles = useCallback((connection) => {
    console.log('[useHandleValidator] Validating connection:', JSON.stringify(connection, null, 2));
    console.log('[useHandleValidator] Current nodes available to validator:', JSON.stringify(nodes.map(n => ({id: n.id, type: n.type})), null, 2));

    if (!connection.source || !connection.target) {
      console.log('[useHandleValidator] Denied: Missing source or target in connection object.');
      return false;
    }
    if (!connection.source || !connection.target) return false;
    
    // Encontrar los nodos fuente y destino
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);

    console.log('[useHandleValidator] Found sourceNode:', sourceNode ? {id: sourceNode.id, type: sourceNode.type} : null);
    console.log('[useHandleValidator] Found targetNode:', targetNode ? {id: targetNode.id, type: targetNode.type} : null);
    
    if (!sourceNode || !targetNode) {
      console.log('[useHandleValidator] Denied: sourceNode or targetNode not found in current nodes array.');
      return false;
    }
    
    // Verificar si el tipo de nodo destino está en la lista de conexiones válidas para el tipo de nodo fuente
    const targetAllowedTypes = validConnections[sourceNode.type];
    if (!targetAllowedTypes) {
      console.log('[useHandleValidator] No target types defined for source type:', sourceNode.type);
      return false; 
    }

    // Regla: StartNode solo puede ser fuente (no puede ser target).
    if (targetNode.type === 'start') {
      console.log('[useHandleValidator] Target is StartNode. Denying.');
      return false;
    }

    // Regla: EndNode solo puede ser target (no puede ser fuente).
    // (Esto ya está cubierto por validConnections['end'] siendo [], pero una verificación explícita es más clara)
    if (sourceNode.type === 'end') {
      console.log('[useHandleValidator] Source is EndNode. Denying.');
      return false;
    }

    // Regla: Prevenir conexiones duplicadas.
    const normalizedSourceHandle = connection.sourceHandle || 'default';
    const normalizedTargetHandle = connection.targetHandle || 'default';
    const existingEdge = edges.find(edge =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      (edge.sourceHandle || 'default') === normalizedSourceHandle &&
      (edge.targetHandle || 'default') === normalizedTargetHandle
    );
    if (existingEdge) {
      console.log('[useHandleValidator] Duplicate edge detected. Denying.');
      return false;
    }

    const isAllowed = targetAllowedTypes.includes(targetNode.type);
    if (!isAllowed) {
      console.log(`[useHandleValidator] Connection ${sourceNode.type} -> ${targetNode.type} not allowed by rules.`);
    }
    return isAllowed; 
  }, [nodes, edges, validConnections]);
  
  return { validConnectionsHandles, validConnections };
};

/**
 * Error Boundary para manejar errores de renderizado en componentes de nodos
 * Evita que un error en un nodo cause la caída de toda la aplicación
 */
class NodeErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[NodeErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="node-error-container">
          <div className="node-error-message">
            <span className="node-error-icon">⚠️</span>
            <span>Error: {this.state.error?.message || 'Error desconocido'}</span>
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
  showSimulation,
  setShowSimulation, 
  notifyByte,
  setByteMessage,
  
  // Props para manejo de errores y UI
  handleError,
  hideHeader = false
}) => {
  // Referencias y navegación
  const navigate = useNavigate();
  const reactFlowWrapperRef = useRef(null);
  const apiClient = useAPI();
  
  // ==============================================
  // SECCIÓN 1: ACCESO AL STORE DE ZUSTAND
  // ==============================================
  
  // Acceso a los datos del store (PRIMERO para evitar redeclaraciones)
  const nodes = useFlowStore(state => state.nodes);
  const edges = useFlowStore(state => state.edges);
  const isUltraMode = useFlowStore(state => state.isUltraMode);
  const lastSaved = useFlowStore(state => state.lastSaved);
  
  // Acceso a las funciones de Zustand
  const {
    // Funciones para actualizar nodos y aristas
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    
    // Funciones de estado e identificación
    setPlubotId, // Corregido: usar la acción del store directamente
    setFlowName,
    toggleUltraMode,
    
    // Funciones de historial
    undo,
    redo,
    
    // Funciones de guardado
    saveFlow
  } = useFlowStore();
  
  // ==============================================
  // SECCIÓN 2: ESTADO LOCAL Y HOOKS BÁSICOS
  // ==============================================

  // Estado básico para identificación y seguimiento
  const [flowName, setLocalFlowName] = useState(name || '');

  // Sistema de modales - DESACTIVADO (ahora gestionado por GlobalProvider)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);

  // Sistema de notificaciones para feedback al usuario
  const [byteStatus, setByteStatus] = useState('success');
  const [showByte, setShowByte] = useState(false);

  // Estado para respaldo, cambios y recuperación
  const [isBackupLoaded, setBackupLoaded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Estado de la instancia de ReactFlow
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Historial global a través del hook unificado
  const {
    addToHistory,
    undo: historyUndo,
    redo: historyRedo,
    canUndo,
    canRedo
  } = useUndoRedo();

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
    onConnectNodes
  } = useFlowElementsManager(saveHistoryState, setHasChanges);

  // Hook para gestionar respaldos locales
  const { createBackup, recoverFromBackup } = useLocalBackupManager(plubotId);

  // Hook para arrastrar y soltar nodos desde la paleta
  const { onDragOver, onDrop } = useDragAndDropManager(reactFlowWrapperRef, reactFlowInstance, setHasChanges);

  // Obtener estilos una sola vez por render (hook debe ir a nivel superior)
  const nodeStyles = useNodeStyles(isUltraMode);

  // Tipos de nodos con optimización de rendimiento
  const nodeTypes = useMemo(() => createNodeTypes(isUltraMode), [isUltraMode]);

  // Tipos de aristas con variantes de estilo
  const edgeTypes = useMemo(() => sharedEdgeTypes, []);

  // Sistema de validación de conexiones entre nodos
  const { validConnectionsHandles } = useHandleValidator(nodes, edges);

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
    console.log(`[FlowEditor] Redirigiendo apertura de modal al sistema global: ${modalName}`);
    
    // Usar el sistema global en su lugar
    if (typeof window.openModal === 'function') {
      window.openModal(modalName);
    } else {
      // Como respaldo, emitir un evento personalizado
      try {
        window.dispatchEvent(new CustomEvent('open-modal', { 
          detail: { modal: modalName, timestamp: Date.now() } 
        }));
      } catch (e) {
        console.error('[FlowEditor] Error al disparar evento global:', e);
      }
    }
  }, []);
  
  // Función para cerrar modales (redirige al sistema global)
  const closeModal = useCallback((modalName) => {
    console.log(`[FlowEditor] Redirigiendo cierre de modal al sistema global: ${modalName}`);
    
    // Usar el sistema global en su lugar
    if (typeof window.closeModal === 'function') {
      window.closeModal(modalName);
    } else {
      // Como respaldo, emitir un evento personalizado
      try {
        window.dispatchEvent(new CustomEvent('close-modal', { 
          detail: { modal: modalName, timestamp: Date.now() } 
        }));
      } catch (e) {
        console.error('[FlowEditor] Error al disparar evento global:', e);
      }
    }
  }, []);
  
  // Función mejorada para guardar el flujo usando Zustand
  const handleSaveFlow = useCallback(async () => {
    if (!plubotId) {
      console.error('No se puede guardar sin plubotId');
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
      console.error('Error al guardar el flujo:', error);
      setByteStatus('error');
      setByteMessage('Error al guardar: ' + (error.message || 'Error desconocido'));
      handleError && handleError(error);
      
      // Crear respaldo local en caso de error
      createBackup(nodes, edges);
    }
  }, [plubotId, nodes, edges, saveFlow, setByteMessage, setByteStatus, handleError]);
  
  // Funciones para mantener el historial (complementando Zustand)
  // historyUndo y historyRedo provienen del hook useUndoRedo
  
  // Funciones optimizadas para actualizar el store
  const onNodesChangeOptimized = useCallback((changes) => {
    onNodesChange(changes);
    setHasChanges(true);
  }, [onNodesChange]);
  
  const onEdgesChangeOptimized = useCallback((changes) => {
    onEdgesChange(changes);
    setHasChanges(true);
  }, [onEdgesChange]);
  
  // Función para conectar nodos
  const isValidConnection = useCallback((connection) => {
    // Evita que un nodo se conecte a sí mismo.
    if (connection.source === connection.target) {
      return false;
    }

    // Regla: Un handle de tipo 'target' solo puede tener una conexión entrante.
    // Esto previene que a un nodo le lleguen múltiples flujos al mismo punto de entrada.
    const isTargetHandleAlreadyConnected = edges.some(
      (edge) => edge.target === connection.target && edge.targetHandle === connection.targetHandle
    );

    if (isTargetHandleAlreadyConnected) {
      return false;
    }

    return true;
  }, [edges]);


  
  // Función para alternar animaciones en las aristas
  const toggleEdgeAnimations = useCallback((animate) => {
    setEdges(edges.map(edge => ({
      ...edge,
      animated: animate
    })));
  }, [edges, setEdges]);
  
  // Interacciones del usuario con el editor (drag&drop, clicks, etc.)
  const onNodeDragStop = useCallback((event, node) => {
    const positionChange = {
      id: node.id,
      type: 'position',
      position: node.position,
      dragging: false, // Indicar que el arrastre ha finalizado
    };
    onNodesChange([positionChange]); // Actualizar el store con la función correcta
    saveHistoryState(); // Guardar el estado en el historial (usa get() internamente)
    setHasChanges(true);
  }, [onNodesChange, saveHistoryState, setHasChanges]);
  
  const onSelectionDragStop = useCallback((event, selectedNodes) => {
    const changes = selectedNodes.map(node => ({
      id: node.id,
      type: 'position',
      position: node.position,
      dragging: false,
    }));
    onNodesChange(changes); // Actualizar el store con la función correcta
    saveHistoryState(); // Guardar el estado en el historial
    setHasChanges(true);
  }, [onNodesChange, saveHistoryState, setHasChanges]);
  
  const onNodeClick = useCallback((event, node) => {
    // Seleccionar el nodo y notificar a los componentes padre
    setSelectedNode(node);
  }, [setSelectedNode]);
  
  const onPaneClick = useCallback(() => {
    // Deseleccionar al hacer clic en el fondo
    setSelectedNode(null);
  }, [setSelectedNode]);
  
  const onEdgeClick = useCallback((event, edge) => {
    // Mostrar editor de conexiones y establecer conexión seleccionada
    setShowConnectionEditor(true);
    setSelectedConnection(edge);
    
    if (edge.data) {
      setConnectionProperties(edge.data);
    } else {
      setConnectionProperties({ text: '' });
    }
  }, [setShowConnectionEditor, setSelectedConnection, setConnectionProperties]);
  
  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    saveHistoryState(nodes, edges);
    
    // Eliminar la arista anterior
    setEdges(edges.filter(e => e.id !== oldEdge.id));
    
    // Crear nueva conexión con el mismo estilo
    const newEdge = {
      ...newConnection,
      id: `e-${newConnection.source}-${newConnection.target}-${Date.now()}`,
      type: oldEdge.type || 'elite-edge',
      animated: oldEdge.animated || false,
      data: oldEdge.data || { text: '' }
    };
    
    // Añadir la nueva conexión
    setEdges([...edges, newEdge]);
    setHasChanges(true);
  }, [nodes, edges, setEdges, saveHistoryState]);
  
  // Variables para el estado de actualización de aristas
  const [edgeUpdateSuccessful, setEdgeUpdateSuccessful] = useState(false);
  
  const onEdgeUpdateStart = useCallback(() => {
    setEdgeUpdateSuccessful(false);
  }, []);
  
  const onEdgeUpdateEnd = useCallback((_, edge) => {
    if (!edgeUpdateSuccessful) {
      setEdges(edges.filter(e => e.id !== edge.id));
      setHasChanges(true);
    }
  }, [edgeUpdateSuccessful, edges, setEdges]);
  
  // Función para manejar mensajes de byte (sistema de notificaciones)
  const handleByteMessage = useCallback((event) => {
    const { message, status } = event.detail;
    
    setByteStatus(status || 'success');
    setByteMessage(message);
    setShowByte(true);
  }, [setByteStatus, setByteMessage]);
  
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
  //       console.log('[FlowEditor] fitView() llamado para ajustar el viewport.');
  //     }, 100); // Un pequeño delay puede ser suficiente

  //     return () => clearTimeout(timer); // Limpiar el timer si el componente se desmonta o las dependencias cambian
  //   }
  // }, [reactFlowInstance, nodes]); // Dependencias: la instancia y los nodos
  
  // ==============================================
  // SECCIÓN 6: RENDERIZADO DEL COMPONENTE
  // ==============================================
  return (
    <div className="flow-editor-container">
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
        showSimulateModal={() => setShowSimulation(true)}
      />
      
      {showByte && (
        <StatusBubble 
          status={byteStatus} 
          message={notifyByte || 'Acción completada'} 
          onClose={() => setShowByte(false)}
        />
      )}
      
      <div className="flow-main-wrapper" ref={reactFlowWrapperRef}>
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
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          project={{
            id: plubotId,
            name: flowName || name
          }}
          onSave={handleSaveFlow}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onSelectionDragStop={onSelectionDragStop}
          onEdgeUpdate={onEdgeUpdate}
          onEdgeUpdateStart={onEdgeUpdateStart}
          onEdgeUpdateEnd={onEdgeUpdateEnd}
          validConnectionsHandles={validConnectionsHandles}
          isUltraMode={isUltraMode}
          // Funciones para modales
          openModal={openModal}
          closeModal={closeModal}
          // Usar las constantes definidas para límites del canvas y nodos
          nodeExtent={NODE_EXTENT}
          translateExtent={TRANSLATE_EXTENT}
          minZoom={MIN_ZOOM}
        />
        
        {/* Interfaces modales */}
        {showSimulation && (
          <Suspense fallback={<TransparentOverlay message="Cargando simulador..." />}>
            <SimulationInterface
              nodes={nodes}
              edges={edges}
              onClose={() => setShowSimulation(false)}
              isUltraMode={isUltraMode}
            />
          </Suspense>
        )}
        
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
  showSimulation,
  setShowSimulation,
  plubotId,
  name,
  notifyByte,
  saveFlowData,
  hideHeader = false
}) => {
  const { isAuthenticated } = useAuthStore(state => ({ isAuthenticated: state.isAuthenticated }));
  const {
    contextMenuVisible,
    contextMenuPosition,
    contextMenuItems,
    hideContextMenu
  } = useFlowStore(
    (state) => ({
      contextMenuVisible: state.contextMenuVisible,
      contextMenuPosition: state.contextMenuPosition,
      contextMenuItems: state.contextMenuItems,
      hideContextMenu: state.hideContextMenu,
    }),
    shallow
  );

  try {
    // Si el usuario no está autenticado y no es una vista pública, no renderizar el editor.
    // Esto previene el "flash" del estado por defecto durante la redirección.
    if (!isAuthenticated && !isPublic) {
      return <div className="flow-editor-unauthenticated">Cargando sesión...</div>;
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
          showSimulation={showSimulation}
          setShowSimulation={setShowSimulation}
          handleError={handleError}
          plubotId={plubotId}
          name={name}
          notifyByte={notifyByte}
          saveFlowData={saveFlowData}
          hideHeader={hideHeader}
        />
        {/* Global Context Menu Renderer */}
        {contextMenuVisible && contextMenuPosition && contextMenuItems && contextMenuItems.length > 0 && (
          <ContextMenu
            position={contextMenuPosition}
            items={contextMenuItems}
            onClose={hideContextMenu}
          />
        )}
      </ReactFlowProvider>
    );
  } catch (error) {
    console.error('Error crítico al renderizar FlowEditor:', error);
    return (
      <div className="flow-editor-error">
        <h3>Error al renderizar el flujo</h3>
        <p>Se ha producido un error crítico. Por favor, recarga la página.</p>
        <pre className="error-details">{error.message}</pre>
        <button onClick={() => window.location.reload()}>Recargar página</button>
      </div>
    );
  }
};

FlowEditor.displayName = 'FlowEditor';

export default FlowEditor;

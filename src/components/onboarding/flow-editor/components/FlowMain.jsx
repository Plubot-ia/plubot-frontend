/**
 * FlowMain.jsx
 * Orquestador visual del editor de flujos
 * Responsable de renderizar nodos y conexiones usando ReactFlow
 * 
 * @version 2.0.0
 */

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
// ReactFlow y sus componentes
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';

// SOLUCIÓN UNIFICADA: Un solo archivo para todos los fixes sin necesidad de múltiples scripts
import '../utils/optimized-flow-fixes';
// CSS CRÍTICO: Esta es nuestra solución necesaria para visibilidad de nodos
import '../force-node-visibility.css';
// SOLUCIÓN MINIMALISTA: Solo hace transparente el pane sin afectar nada más
import './transparent-pane.css';

// Importar el gestor de modo ultra rendimiento
import { toggleUltraMode, stopAllAnimations, restoreAnimations } from '../ui/UltraModeManager';

// Zustand Store - acceso optimizado con selectores
import useFlowStore from '@/stores/useFlowStore';

// Hooks específicos para optimización y rendimiento
import useNodeStyles from '../hooks/useNodeStyles';
import useAdaptivePerformance from '../hooks/useAdaptivePerformance';

// Componentes de UI
import MiniMapWrapper from './MiniMapWrapper';
import ZoomControls from '../ui/ZoomControls';
import BackgroundScene from '../ui/BackgroundScene';
import NodeContextMenu from './menus/NodeContextMenu';
import EdgeContextMenu from './menus/EdgeContextMenu';
import EliteEdge from '../ui/EliteEdge';

// Importar modales
import SimulationInterface from '@/components/onboarding/simulation/SimulationInterface';
import EmbedModal from '@/components/onboarding/modals/EmbedModal';
import SyncModal from '@/components/onboarding/modals/SyncModal';
import TemplateSelector from '@/components/onboarding/modals/TemplateSelector';
import ImportExportModal from '@/components/onboarding/modals/ImportExportModal';

// Importar utilidades
import { throttle, debounce } from 'lodash';
import { ensureEdgesAreVisible } from '../utils/edgeFixUtil';
import { NODE_TYPES } from '@/utils/nodeConfig';
// Importar definiciones de límites para el canvas y los nodos
import { NODE_EXTENT, TRANSLATE_EXTENT, MIN_ZOOM, MAX_ZOOM } from '../utils/flow-extents';

// Componentes de nodos - importados directamente para asegurar que se cargan como corresponde
import StartNode from '@/components/onboarding/nodes/startnode/StartNode';
import EndNode from '@/components/onboarding/nodes/endnode/EndNode';
import MessageNode from '@/components/onboarding/nodes/messagenode/MessageNode';
import DecisionNode from '@/components/onboarding/nodes/decisionnode/DecisionNode';
import ActionNode from '@/components/onboarding/nodes/actionnode/ActionNode';
import OptionNode from '@/components/onboarding/nodes/optionnode/OptionNode';
import HttpRequestNode from '@/components/onboarding/nodes/httprequestnode/HttpRequestNode';
import PowerNode from '@/components/onboarding/nodes/powernode/PowerNode';

// Estilos CSS necesarios para el funcionamiento del componente
import '../ui/elite-drag-optimizations.css';
// La solución CSS se consolidó en force-node-visibility.css
import '../fix-overflow.css';
import '../fix-overlay.css';
import '../forcePatch.css';
// Importar soluciones para eliminar estilos de debugging
import '../ui/remove-debug-styles.css';
import '../ui/hide-debug-elements.css'; // Solución adicional para garantizar que no haya elementos de depuración visibles
import '../ui/ensure-node-visibility.css';
import '../ui/mega-drag-fix.css'; // Solución definitiva de arrastre para garantizar que no haya elementos de depuración visibles

// Componentes esenciales
import StorageQuotaManager from './StorageQuotaManager';
import HideControls from './HideControls';

// Estilos para controles del editor
import '../ui/ZoomControls.css';
import '../ui/VerticalButtons.css';
import '../ui/EliteEdge.css';
import '../ui/FlowControls.css';
import '../ui/HistoryControls.css';
import '../ui/SyncButton.css';
import '../ui/UltraMode.css';
import '../ui/ensure-node-visibility.css'; // SOLUCIÓN DEFINITIVA para los nodos invisibles

// Optimización: Todas las funciones de corrección vienen de optimized-flow-fixes
// Las importaciones se realizan en la parte superior del archivo
import { fixNodePositions } from '../utils/fix-node-positions';
// Importar solución para el posicionamiento correcto de nodos
import { calculateCorrectDropPosition } from '../drop-position-fix';
// Importar el sistema de garantía de interacción de nodos
import { ensureNodesAreInteractive, setupNodeInteractionObserver, stopNodeInteractionObserver } from '../utils/ensure-node-interaction';
// Importar el sanitizador de paths de aristas

// Importar estilos CSS para posicionamiento de nodos
import '../node-positioning.css';
import { patchReactFlowEdgePaths, useEdgePathSanitizer } from '../utils/edge-path-sanitizer';
// Importar el nuevo validador de posiciones de nodos
import { validateNodePositions, sanitizeEdgePaths } from '../utils/node-position-validator';
// Importar y aplicar automáticamente el parche de validación de posiciones
import '../utils/position-validator-patch';

/**
 * Componente principal FlowMain
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.project - Información del proyecto actual
 * @param {Function} props.onSave - Función para guardar cambios
 * @param {Object} props.reactFlowInstance - Instancia de ReactFlow (opcional)
 * @param {Function} props.setReactFlowInstance - Setter para la instancia de ReactFlow (opcional)
 * @param {Function} props.onNodesChange - Manejador para cambios en nodos (opcional)
 * @param {Function} props.onEdgesChange - Manejador para cambios en aristas (opcional)
 * @param {Function} props.onConnect - Manejador para conexiones (opcional)
 * @param {Function} props.onNodeClick - Manejador para clic en nodo (opcional)
 * @param {Function} props.onPaneClick - Manejador para clic en el panel (opcional)
 * @param {Function} props.onEdgeClick - Manejador para clic en arista (opcional)
 */
const FlowMain = ({
  project,
  onSave,
  reactFlowInstance: incomingReactFlowInstance,
  setReactFlowInstance, // Retained for clarity, will be used as externalSetReactFlowInstance internally
  nodes: externalNodes,
  edges: externalEdges,
  onNodesChange: externalOnNodesChange,
  onEdgesChange: externalOnEdgesChange,
  onConnect: externalOnConnect,
  onNodeClick: externalOnNodeClick,
  onPaneClick: externalOnPaneClick,
  onEdgeClick: externalOnEdgeClick,
  onNodeDragStop: externalOnNodeDragStop,
  onSelectionDragStop: externalOnSelectionDragStop,
  onDragOver: externalOnDragOver,
  onDrop: externalOnDrop,
  onEdgeUpdate: externalOnEdgeUpdate,
  onEdgeUpdateStart: externalOnEdgeUpdateStart,
  onEdgeUpdateEnd: externalOnEdgeUpdateEnd,
  nodeTypes: externalNodeTypes,
  edgeTypes: externalEdgeTypes,
  validConnectionsHandles: externalValidConnectionsHandles,
  isUltraMode: externalIsUltraMode,
  openModal: externalOpenModal,
  closeModal: externalCloseModal,
  showEmbedModal: externalShowEmbedModal,
  showTemplateSelector: externalShowTemplateSelector,
  showImportExportModal: externalShowImportExportModal,
  // Props for canvas behavior - utilizamos valores predeterminados si no se proporcionan
  nodeExtent = NODE_EXTENT,
  translateExtent = TRANSLATE_EXTENT,
  minZoom = MIN_ZOOM,
}) => {
  // Props are now directly available from the function signature's destructuring.
  // For clarity, `setReactFlowInstance` from props is aliased to `externalSetReactFlowInstance` if needed for callbacks.
  const externalSetReactFlowInstance = setReactFlowInstance;

  // `project`, `onSave`, `externalNodes`, `externalEdges`, `externalOnNodesChange`, etc.,
  // `externalNodeTypes`, `externalEdgeTypes`, `externalOpenModal`, `externalCloseModal`,
  // `externalShowEmbedModal`, `externalShowTemplateSelector`, `externalShowImportExportModal`
  // are all directly available.
  // -----------------------------------------
  // REFERENCIAS Y ESTADO LOCAL
  // -----------------------------------------
  const flowContainerRef = useRef(null);
  const reactFlowInstanceRef = useRef(null);
  const isInitialLoad = useRef(true);
  const nodeCache = useRef(new Map());
  const edgeCache = useRef(new Map());
  
  // Referencias para el estado del sistema
  // Nota: Las referencias de rendimiento ahora se manejan en useAdaptivePerformance
  
  // Estado local para menús contextuales y modales
  const [menuOpen, setMenuOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Estados para modales internos (solo los que no vienen de props)
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  
  // -----------------------------------------
  // ACCESO AL STORE DE ZUSTAND (SELECTORES)
  // -----------------------------------------
  // Selectores optimizados para minimizar renderizaciones
  const zustandNodes = useFlowStore(state => state.nodes);
  const zustandEdges = useFlowStore(state => state.edges);
  const isUltraMode = useFlowStore(state => state.isUltraMode);
  const plubotId = useFlowStore(state => state.plubotId);
  const flowName = useFlowStore(state => state.flowName);
  
  // Acciones del store con memoización
  const { setNodes, setEdges, onNodesChange, onEdgesChange, onConnect, toggleUltraMode, undo, redo } = useFlowStore();
  
  // Determinar si se están usando nodos externos o internos
  const nodes = externalNodes || zustandNodes;
  const edges = externalEdges || zustandEdges;
  
  // Estado para capacidades de deshacer/rehacer
  const canUndo = useFlowStore(state => state.history?.undoStack?.length > 0);
  const canRedo = useFlowStore(state => state.history?.redoStack?.length > 0);
  
  // -----------------------------------------
  // HOOKS PERSONALIZADOS
  // -----------------------------------------
  // Sistema unificado de optimización de rendimiento
  const { 
    optimizationLevel,
    startMonitoring,
    updatePerformance,
    measurePerformance,
    fpsRef,
    getStats
  } = useAdaptivePerformance();
  
  // Estadísticas de rendimiento accesibles en la UI
  const perfStats = useMemo(() => getStats(), [getStats, nodes.length]);
  
  // Obtener estilos para nodos
  const nodeStyles = useNodeStyles(isUltraMode);
  
  // Instancia de ReactFlow para operaciones de viewport
  const reactFlowInstance = useReactFlow();
  
  // -----------------------------------------
  // TIPOS DE NODOS Y ARISTAS
  // -----------------------------------------
  /**
   * Configura los tipos de nodos disponibles en el editor
   * Cada tipo se mapea a su componente correspondiente
   * Utilizamos memoización para evitar recrear los tipos en cada renderizado
   */
  const nodeTypes = useMemo(() => {
    // Si se proporcionan tipos externos, usarlos
    if (externalNodeTypes) return externalNodeTypes;
    
    // Obtener funciones necesarias del store
    const flowStore = useFlowStore.getState();
    
    // Verificar que estas funciones existen para evitar errores
    const storeOnNodesChange = flowStore.onNodesChange || (() => console.warn('onNodesChange no disponible'));
    const storeSetNodes = flowStore.setNodes || (() => console.warn('setNodes no disponible'));
    const storeSetEdges = flowStore.setEdges || (() => console.warn('setEdges no disponible'));
    
    // Registrar tipos con todas las props necesarias
    console.log('[FlowMain] Registrando tipos de nodos con todas las props necesarias');
    
    // Definimos un objeto memoizado que no cambiará en cada renderizado
    const types = {
      start: props => (
        <StartNode 
          {...props} 
          styles={nodeStyles} 
          onNodesChange={storeOnNodesChange}
          setNodes={storeSetNodes}
          setEdges={storeSetEdges}
          isUltraPerformanceMode={isUltraMode}
        />
      ),
      end: props => (
        <EndNode 
          {...props} 
          styles={nodeStyles} 
          onNodesChange={storeOnNodesChange}
          setNodes={storeSetNodes}
          setEdges={storeSetEdges}
          isUltraPerformanceMode={isUltraMode}
        />
      ),
      message: props => (
        <MessageNode 
          {...props} 
          styles={nodeStyles} 
          onNodesChange={storeOnNodesChange}
          setNodes={storeSetNodes}
          setEdges={storeSetEdges}
          isUltraPerformanceMode={isUltraMode}
        />
      ),
      decision: props => (
        <DecisionNode 
          {...props} 
          styles={nodeStyles} 
          onNodesChange={storeOnNodesChange}
          setNodes={storeSetNodes}
          setEdges={storeSetEdges}
          isUltraPerformanceMode={isUltraMode}
        />
      ),
      action: props => (
        <ActionNode 
          {...props} 
          styles={nodeStyles} 
          onNodesChange={storeOnNodesChange}
          setNodes={storeSetNodes}
          setEdges={storeSetEdges}
          isUltraPerformanceMode={isUltraMode}
        />
      ),
      option: props => (
        <OptionNode 
          {...props} 
          styles={nodeStyles} 
          onNodesChange={storeOnNodesChange}
          setNodes={storeSetNodes}
          setEdges={storeSetEdges}
          isUltraPerformanceMode={isUltraMode}
        />
      ),
      httpRequest: props => (
        <HttpRequestNode 
          {...props} 
          styles={nodeStyles} 
          onNodesChange={storeOnNodesChange}
          setNodes={storeSetNodes}
          setEdges={storeSetEdges}
          isUltraPerformanceMode={isUltraMode}
        />
      ),
      power: props => (
        <PowerNode 
          {...props} 
          styles={nodeStyles} 
          onNodesChange={storeOnNodesChange}
          setNodes={storeSetNodes}
          setEdges={storeSetEdges}
          isUltraPerformanceMode={isUltraMode}
        />
      )
    };
    
    return types;
  }, [externalNodeTypes, nodeStyles, isUltraMode]);
  
  /**
   * Configura los tipos de aristas disponibles en el editor
   * Usa EliteEdge como componente base con diferentes variantes
   * Utilizamos memoización para evitar recrear los tipos en cada renderizado
   */
  const edgeTypes = useMemo(() => {
    // Si se proporcionan tipos externos, usarlos
    if (externalEdgeTypes) return externalEdgeTypes;
    
    // Definimos un objeto memoizado que no cambiará en cada renderizado
    const types = {
      'default': props => <EliteEdge {...props} variant="default" />, // Establecer EliteEdge como default
      'elite-edge': props => <EliteEdge {...props} variant="default" />,
      'success-edge': props => <EliteEdge {...props} variant="success" />,
      'warning-edge': props => <EliteEdge {...props} variant="warning" />,
      'error-edge': props => <EliteEdge {...props} variant="error" />,
      'custom-edge': props => <EliteEdge {...props} variant="custom" />
    };
    
    return types;
  }, [externalEdgeTypes]);
  
  // -----------------------------------------
  // MANEJADORES DE EVENTOS
  // -----------------------------------------
  /**
   * Manejador para cambios en nodos
   * @param {Array} changes - Cambios a aplicar a los nodos
   */
  const handleNodesChange = useCallback((changes) => {
    if (externalOnNodesChange) {
      externalOnNodesChange(changes);
    } else {
      onNodesChange(changes);
    }
  }, [externalOnNodesChange, onNodesChange]);
  
  /**
   * Manejador para cambios en aristas
   * Permite actualizar el estado global
   * @param {Array} changes - Cambios en las aristas
   */
  const handleEdgesChange = useCallback((changes) => {
    // Sanitizar paths de aristas antes de aplicar los cambios
    const sanitizedChanges = changes.map(change => {
      // Si el cambio es del tipo 'add' y tiene un item con data.path, sanitizar el path
      if (change.type === 'add' && change.item && change.item.data && change.item.data.path) {
        return {
          ...change,
          item: {
            ...change.item,
            data: {
              ...change.item.data,
              path: change.item.data.path.replace(/NaN/g, '0')
            }
          }
        };
      }
      return change;
    });
    
    // Manejar cambios en las aristas
    if (externalOnEdgesChange) {
      externalOnEdgesChange(sanitizedChanges);
    } else {
      onEdgesChange(sanitizedChanges);
    }
  }, [externalOnEdgesChange, onEdgesChange]);
  
  /**
   * Manejador para conexiones entre nodos
   * @param {Object} params - Parámetros de la conexión
   */
  const handleConnect = useCallback((params) => {
    if (externalOnConnect) {
      externalOnConnect(params);
    } else {
      onConnect(params);
    }
  }, [externalOnConnect, onConnect]);
  
  /**
   * Manejador para clic en nodo
   * @param {Event} event - Evento del clic
   * @param {Object} node - Nodo seleccionado
   */
  const handleNodeClick = useCallback((event, node) => {
    if (externalOnNodeClick) {
      externalOnNodeClick(event, node);
    } else {
      setSelectedNode(node);
      setMenuOpen(false);
    }
  }, [externalOnNodeClick]);
  
  /**
   * Manejador para clic en el panel
   * @param {Event} event - Evento del clic
   */
  const handlePaneClick = useCallback((event) => {
    if (externalOnPaneClick) {
      externalOnPaneClick(event);
    } else {
      setSelectedNode(null);
      setSelectedEdge(null);
      setMenuOpen(false);
    }
  }, [externalOnPaneClick]);
  
  /**
   * Manejador para clic en arista
   * @param {Event} event - Evento del clic
   * @param {Object} edge - Arista seleccionada
   */
  const handleEdgeClick = useCallback((event, edge) => {
    if (externalOnEdgeClick) {
      externalOnEdgeClick(event, edge);
    } else {
      event.stopPropagation();
      setSelectedEdge(edge);
      setMenuOpen(true);
      setMenu('edge');
      setMenuPosition({
        x: event.clientX,
        y: event.clientY
      });
    }
  }, [externalOnEdgeClick]);
  
  /**
   * Manejador para clic derecho en nodo (menú contextual)
   * @param {Event} event - Evento del clic
   * @param {Object} node - Nodo seleccionado
   */
  const handleNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setSelectedNode(node);
    setMenuOpen(true);
    setMenu('node');
    if (reactFlowInstance) {
      const panePosition = reactFlowInstance.project({ x: event.clientX, y: event.clientY });
      setMenuPosition(panePosition);
    } else {
      // Fallback o error si la instancia no está disponible
      setMenuPosition({ x: event.clientX, y: event.clientY });
      console.error('React Flow instance not available for context menu positioning');
    }
  }, []);
  
  /**
   * Manejador para fin de arrastre de nodo
   * @param {Event} event - Evento de arrastre
   * @param {Object} node - Nodo arrastrado
   */
  // Crear un sistema de debounce para las validaciones de posición
  const validationDebounceRef = useRef(null);
  
  const handleNodeDragStop = useCallback((event, node) => {
    // Este evento se dispara cuando el usuario termina de arrastrar un nodo
    setIsDragging(false);
    
    // IMPORTANTE: Restablecer la bandera de arrastre en progreso
    // para permitir que el sistema de validación funcione normalmente - FORMA SEGURA
    try {
      if (typeof window !== 'undefined') {
        window.__dragInProgress = false;
      }
    } catch (e) {
      // Manejar error de forma silenciosa
    }
    
    // ULTRA IMPORTANTE: Quitar la clase del body para volver a la normalidad - FORMA SEGURA
    try {
      document.body.classList.remove('elite-node-dragging'); // Corregir nombre de la clase
    } catch (e) {
      // Manejar error de forma silenciosa
    }
    
    // Validación pospuesta - solo al final del arrastre
    // Esto mejora drásticamente el rendimiento al mover nodos
    if (validationDebounceRef.current) {
      clearTimeout(validationDebounceRef.current);
    }
    
    // Retrasar ligeramente la validación para garantizar fluidez
    validationDebounceRef.current = setTimeout(() => {
      // Validar y corregir posiciones después del arrastre
      const currentNodes = useFlowStore.getState().nodes;
      if (currentNodes && currentNodes.length > 0) {
        const validatedNodes = validateNodePositions(currentNodes);
        if (validatedNodes !== currentNodes) {
          useFlowStore.getState().setNodes(validatedNodes);
        }
      }
      
      // Sanear paths de aristas después del arrastre
      sanitizeEdgePaths();
      
      validationDebounceRef.current = null;
    }, 200); // Aumentar ligeramente el retraso para garantizar mayor fluidez
    
    if (externalOnNodeDragStop) {
      externalOnNodeDragStop(event, node);
    }
  }, [externalOnNodeDragStop]);
  
  /**
   * Manejador para fin de arrastre de selección
   * @param {Event} event - Evento de arrastre
   * @param {Array} nodes - Nodos seleccionados
   */
  const handleSelectionDragStop = useCallback((event, nodes) => {
    if (externalOnSelectionDragStop) {
      externalOnSelectionDragStop(event, nodes);
    }
  }, [externalOnSelectionDragStop]);
  
  /**
   * Manejador para arrastrar sobre el panel
   * @param {Event} event - Evento de arrastre
   */
  const handleDragOver = useCallback((event) => {
    if (externalOnDragOver) {
      externalOnDragOver(event);
    } else {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  }, [externalOnDragOver]);
  
  /**
   * Manejador para soltar en el panel
   * @param {Event} event - Evento de soltar
   */
  /**
   * Manejador de drop usando calculateCorrectDropPosition del módulo drop-position-fix
   */
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    
    // Si hay un manejador externo, lo llamamos primero
    if (externalOnDrop) {
      externalOnDrop(event);
      return; // Permitimos que el manejador externo maneje todo
    }
    
    // Implementación directa utilizando drop-position-fix.js
    try {
      // Obtener el tipo de nodo desde el dataTransfer
      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) {
        console.log('[FlowMain] No se encontró tipo de nodo en el drop');
        return;
      }
      
      // Importar la función de cálculo de posición de drop-position-fix.js
      const position = calculateCorrectDropPosition(event);
      
      // Crear nuevo nodo con la posición calculada
      const newNode = {
        id: `${nodeType.toLowerCase()}-${Date.now()}`,
        type: nodeType,
        position,
        data: { label: `Nuevo ${nodeType}` },
        dragHandle: '.custom-drag-handle',
      };
      
      // Añadir el nodo al store
      useFlowStore.getState().addNode(newNode);
      console.log('[FlowMain] Nodo añadido correctamente con ID:', newNode.id);
      
    } catch (error) {
      console.error('[FlowMain] Error al manejar drop:', error);
    }
  }, [externalOnDrop]);
  
  /**
   * Manejador para actualización de arista
   * @param {Object} oldEdge - Arista anterior
   * @param {Object} newConnection - Nueva conexión
   */
  const handleEdgeUpdate = useCallback((oldEdge, newConnection) => {
    if (externalOnEdgeUpdate) {
      externalOnEdgeUpdate(oldEdge, newConnection);
    }
  }, [externalOnEdgeUpdate]);
  
  /**
   * Manejador para inicio de actualización de arista
   */
  const handleEdgeUpdateStart = useCallback(() => {
    if (externalOnEdgeUpdateStart) {
      externalOnEdgeUpdateStart();
    }
  }, [externalOnEdgeUpdateStart]);
  
  /**
   * Manejador para fin de actualización de arista
   * @param {Event} event - Evento de actualización
   * @param {Object} edge - Arista actualizada
   */
  const handleEdgeUpdateEnd = useCallback((event, edge) => {
    if (externalOnEdgeUpdateEnd) {
      externalOnEdgeUpdateEnd(event, edge);
    }
  }, [externalOnEdgeUpdateEnd]);
  
  /**
   * Validador de conexiones entre nodos
   * @param {Object} connection - Conexión a validar
   * @returns {boolean} - true si la conexión es válida
   */
  const isValidConnection = useCallback((connection) => {
    // Siempre delegar a externalValidConnectionsHandles si se proporciona.
    // Esta función ahora vendrá de useHandleValidator en FlowEditor.jsx y contendrá toda la lógica.
    if (typeof externalValidConnectionsHandles === 'function') {
      // Los console.log detallados ahora estarán dentro de la función de useHandleValidator.
      return externalValidConnectionsHandles(connection);
    }

    // Fallback MUY permisivo si no se proporciona un validador externo (no debería ocurrir en este proyecto).
    console.warn('[isValidConnection FlowMain] No externalValidConnectionsHandles provided. Allowing all connections by default.');
    return true;
  }, [externalValidConnectionsHandles]);
  
  // -----------------------------------------
  // FUNCIONES AUXILIARES
  // -----------------------------------------
  /**
   * Funciones para gestionar los modales
   */
  const handleOpenEmbedModal = useCallback(() => {
    externalOpenModal('embedModal');
  }, [externalOpenModal]);
  
  const handleOpenTemplateSelector = useCallback(() => {
    externalOpenModal('templateSelector');
  }, [externalOpenModal]);
  
  const handleOpenOptionsModal = useCallback(() => {
    externalOpenModal('importExportModal');
  }, [externalOpenModal]);
  
  const handleOpenSimulation = useCallback(() => {
    setShowSimulation(true);
  }, []);
  
  /**
   * Manejador optimizado para alternar modo Ultra Rendimiento
   * Usa el sistema centralizado UltraModeManager
   */
  const handleToggleUltraMode = useCallback(() => {
    // Buscar contenedor de botones
    const buttonsContainer = document.querySelector('.editor-controls-container');
    
    if (buttonsContainer) {
      // Evitar múltiples clics durante la transición
      if (buttonsContainer.dataset.transitioning === 'true') {
        return;
      }
      
      // Marcar como en transición
      buttonsContainer.dataset.transitioning = 'true';
      
      // 1. Cambiar la apariencia visual del botón inmediatamente
      const ultraButton = document.querySelector('.editor-button.ultra');
      if (ultraButton) {
        if (!isUltraMode) {
          ultraButton.style.border = '1px solid rgba(227, 23, 227, 0.8)';
          ultraButton.style.boxShadow = '0 0 8px rgba(227, 23, 227, 0.5), 0 0 4px rgba(227, 23, 227, 0.3) inset';
        } else {
          ultraButton.style.border = '1px solid rgba(0, 200, 224, 0.8)';
          ultraButton.style.boxShadow = '0 0 8px rgba(0, 200, 224, 0.5), 0 0 4px rgba(0, 200, 224, 0.3) inset';
        }
      }
      
      // 2. Cambiar el estado en el store
      toggleUltraMode();
      
      // 3. Usar el UltraModeManager para gestionar todas las animaciones
      if (!isUltraMode) {
        // Activando modo ultra - detener animaciones
        stopAllAnimations(true);
      } else {
        // Desactivando modo ultra - restaurar animaciones
        restoreAnimations();
      }
      
      // 4. Permitir nuevas interacciones después de un tiempo
      setTimeout(() => {
        buttonsContainer.dataset.transitioning = 'false';
      }, 100); // Reducido para mayor fluidez
    } else {
      // Si no encontramos el contenedor, usar solo el sistema centralizado
      if (!isUltraMode) {
        // Cambiar el estado en Zustand
        toggleUltraMode();
        // Activar modo ultra a nivel DOM
        stopAllAnimations(true);
      } else {
        // Cambiar el estado en Zustand
        toggleUltraMode();
        // Desactivar modo ultra a nivel DOM
        restoreAnimations();
      }
    }
  }, [toggleUltraMode, isUltraMode]);
  
  /**
   * Objeto con información del plubot para los modales
   */
  const plubotInfo = useMemo(() => ({
    id: project?.id || plubotId,
    name: project?.name || flowName || 'Flujo sin nombre'
  }), [project, plubotId, flowName]);
  
  // ID del flujo (igual al ID del plubot)
  const flowId = project?.id || plubotId;
  
  // Aplicar solución unificada para todos los problemas de ReactFlow
  useEffect(() => {
    // Importamos la solución optimizada
    // import('../utils/optimized-flow-fixes').then(({ initOptimizedFixes }) => {
      // Configuración mínima: sin logs y con intervalo largo para mejor rendimiento
/*      const cleanup = initOptimizedFixes({
        enableLogs: process.env.NODE_ENV === 'development' && false, // Deshabilitar logs incluso en desarrollo
        fixInterval: 3000, // Reducir frecuencia a 3 segundos
        fixes: {
          nodeDrag: true,
          nodeVisibility: true,
          removeBlueRectangle: true,
          hideControls: true
        }
      });
      
      // Notificar que las correcciones se han aplicado
      window.dispatchEvent(new CustomEvent('flow-fixed'));
      
      // Devolver función de limpieza
      return () => {}; // Devolver una función de limpieza vacía
    }); */
/*    }).catch(error => {
      console.error('[FlowMain] Error al inicializar fixes optimizados:', error);
    }); */
  }, []); // Sin dependencias para ejecutarse solo al montar/desmontar
  
  /**
   * Efecto para asegurar visibilidad de aristas periódicamente
   */
  useEffect(() => {
    if (!edges || edges.length === 0) return;
    
    // Verificar aristas cada 10 segundos para asegurar visibilidad
    const interval = setInterval(() => {
      // NUEVA CONDICIÓN: Solo ejecutar si no se está arrastrando un nodo
      if (typeof window !== 'undefined' && window.__dragInProgress) {
        // console.log('[FlowMain Periodic Edge Check] Drag in progress, skipping ensureEdgesAreVisible.');
        return;
      }
      
      // Modificación para manejar la promesa de ensureEdgesAreVisible
      (async () => {
        try {
          // Llamamos a ensureEdgesAreVisible con los parámetros que espera.
          // Si isUltraMode, maxAttempts, delay no están disponibles aquí, tomarán sus defaults.
          // Por ahora, solo pasamos 'edges' como en el código original.
          const resolvedVisibleEdges = await ensureEdgesAreVisible(edges);
          
          // Comparamos las aristas resueltas con las actuales
          if (JSON.stringify(resolvedVisibleEdges) !== JSON.stringify(edges)) {
            if (typeof setEdges === 'function') {
              console.log('[FlowMain Periodic Edge Check] Actualizando aristas porque se detectó una diferencia.');
              setEdges(resolvedVisibleEdges);
            } else if (externalOnEdgesChange) {
              console.log('[FlowMain Periodic Edge Check] Llamando a externalOnEdgesChange porque se detectó una diferencia.');
              externalOnEdgesChange(resolvedVisibleEdges);
            }
          }
        } catch (error) {
          console.error('[FlowMain Periodic Edge Check] Error al asegurar la visibilidad de las aristas:', error);
        }
      })();
    }, 10000); // Verificar cada 10 segundos

    // Limpiar el intervalo cuando el componente se desmonte o las dependencias cambien
    return () => clearInterval(interval);
  }, [edges, setEdges, externalOnEdgesChange]); // Añadido externalOnEdgesChange a las dependencias por si se usa
  
  /**
   * Efecto para sincronizar instancia de ReactFlow
   */
  useEffect(() => {
    if (incomingReactFlowInstance) {
      reactFlowInstanceRef.current = incomingReactFlowInstance;
    }
  }, [incomingReactFlowInstance]);
  
  /**
   * Efecto para iniciar el sistema de monitoreo de rendimiento
   */
  useEffect(() => {
    // Iniciar el sistema de monitoreo de rendimiento adaptativo
    const cleanup = startMonitoring(nodes, edges);
    
    // Actualizar rendimiento inicialmente
    updatePerformance(nodes, edges);
    
    return cleanup;
  }, [nodes, edges, startMonitoring, updatePerformance]);
  
  /**
   * Efecto para aplicar correcciones cuando cambian los nodos
   */
  useEffect(() => {
    if (!nodes || !Array.isArray(nodes)) return;
    
    // Solo aplicar si hay nodos y no es la carga inicial
    if (nodes.length > 0 && !isInitialLoad.current) {
      try {
        // Usar la versión actualizada de fixNodePositions que acepta un array directamente
        // y una función para actualizar los nodos
        const updatedNodes = fixNodePositions(nodes);
        
        // Si se obtuvieron nodos actualizados y son diferentes, actualizarlos
        if (updatedNodes && updatedNodes !== nodes && typeof setNodes === 'function') {
          console.log('[FlowMain] Aplicando nodos reposicionados');
          setNodes(updatedNodes);
        }
      } catch (error) {
        console.error('[FlowMain] Error al corregir posiciones de nodos:', error);
      }
      
      // Aplicar el sistema de garantía de interacción
      ensureNodesAreInteractive();
    }
    
    // Marcar que ya no es la carga inicial
    if (isInitialLoad.current && nodes.length > 0) {
      isInitialLoad.current = false;
      // Garantizar interacción después de la carga inicial
      setTimeout(() => ensureNodesAreInteractive(true), 300);
    }
  }, [nodes, setNodes]);
  
  /**
   * Efectos de limpieza y monitoreo de cambios
   */
  useEffect(() => {
    return () => {
      // Limpiar recursos cuando el componente se desmonta
      console.log('[FlowMain] Desmontando y limpiando recursos');
      // Detener el sistema de garantía de interacción de nodos
      stopNodeInteractionObserver();
    };
  }, []);
  
  // -----------------------------------------
  // RENDERIZADO
  // -----------------------------------------
  return (
    <div className="flow-main" ref={flowContainerRef} style={{ width: '100%', height: '100%', minHeight: '500px' }}>
      {/* Gestor de cuota de almacenamiento - componente invisible que limpia localStorage */}
      <StorageQuotaManager />
      <HideControls />
      {/* SOLUCIÓN DIRECTA: ReactFlow con configuración optimizada para posicionamiento correcto */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onInit={(instance) => {
          // Guardar la instancia
          reactFlowInstanceRef.current = instance;
          if (typeof window !== 'undefined') {
            window.reactFlowInstance = instance;
          }
          useFlowStore.getState().setReactFlowInstance(instance);
          
          // Si hay una función externa para establecer la instancia, llamarla
          if (typeof externalSetReactFlowInstance === 'function') {
            externalSetReactFlowInstance(instance);
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onSelectionChange={(params) => {
          // Procesamiento condicional pero SIEMPRE manteniendo la estructura de hooks
          // Esto es crucial para evitar errores "Rendered fewer hooks than expected"
          const shouldProcess = !isDragging; // Usamos el estado React isDragging en lugar de la variable global
          
          // Si estamos arrastrando, procesamos mínimamente pero mantenemos la estructura
          
          // Si hay un manejador externo, usarlo - pero SIEMPRE manteniendo la estructura
          if (typeof externalOnSelectionChange === 'function') {
            // Llamar al callback externo solo si no estamos arrastrando
            if (shouldProcess) {
              externalOnSelectionChange(params);
            }
          } else {
            // Implementación por defecto - SIN LOGGING para evitar sobrecarga
            
            // Actualizar estado local solo cuando: 
            // 1. No estamos en medio de un arrastre (shouldProcess = true)
            // 2. La selección realmente ha cambiado
            const selectedNodeId = selectedNode?.id;
            const newSelectedNodeId = params?.nodes?.[0]?.id;
            
            if (shouldProcess && selectedNodeId !== newSelectedNodeId) {
              if (params?.nodes?.length > 0) {
                setSelectedNode(params.nodes[0]);
              } else {
                setSelectedNode(null);
              }
            }
          }
        }}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeDragStop={handleNodeDragStop}
        onNodeDragStart={(event, node) => {
          console.log('[FlowMain] onNodeDragStart: setting window.__dragInProgress = true', 'Node ID:', node.id);
          window.__dragInProgress = true;
          setIsDragging(true);
          // Aquí puedes añadir cualquier lógica específica que necesites al iniciar el arrastre
          // Por ejemplo, analyticsService.track('Node Drag Start', { nodeId: node.id, nodeType: node.type });
        }}
        onNodeDrag={(event, node) => {
          // PRIORIDAD MÁXIMA: NO realizar NINGÚN cálculo aquí
          // Esta función debe ser lo más ligera posible
          
          // Actualizar la posición del nodo actual en tiempo real para
          // asegurar que se muestre correctamente mientras se arrastra
          if (node && node.id) {
            const nodeElement = document.querySelector(`.react-flow__node[data-id="${node.id}"]`);
            if (nodeElement) {
              // Asegurar visibilidad absoluta durante el arrastre
              nodeElement.classList.add('dragging');
            }
          }
          
          // Permitir callback externo SOLO si es absolutamente necesario
          if (typeof externalOnNodeDrag === 'function') {
            // Ejecutar el callback en el próximo frame para evitar bloqueos
            requestAnimationFrame(() => {
              externalOnNodeDrag(event, node);
            });
          }
        }}
        onEdgeUpdate={handleEdgeUpdate}
        onSelectionDragStop={handleSelectionDragStop}
        fitView={false}
        snapToGrid={false}
        snapGrid={[15, 15]}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Control', 'Meta']}
        selectionKeyCode={'Shift'}
        panActivationKeyCode={'Space'}
        zoomActivationKeyCode={'Meta'}
        connectionRadius={75}
        maxZoom={MAX_ZOOM}
        minZoom={minZoom}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }} // Corregido para usar defaultViewport
        nodeExtent={[[-50000, -50000], [50000, 50000]]} /* Configuración ampliada para máxima libertad de posicionamiento */
        translateExtent={[[-50000, -50000], [50000, 50000]]} /* Configuración ampliada para permitir panear libremente */
        proOptions={{ hideAttribution: true }}
        className="flow-main-canvas"
        onlyRenderVisibleElements={false} /* IMPORTANTE: Mantener desactivado para mostrar todos los nodos */
        isValidConnection={isValidConnection}
        fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }} 
        autoPanOnConnect={false}
        autoPanOnNodeDrag={false}
        attributionPosition="bottom-right"
        elementsSelectable={true}
        defaultEdgeOptions={{ zIndex: 0 }}
        nodesDraggable={true}
        nodesConnectable={true}
        // SOLUCIÓN MEJORADA: Configuración optimizada para navegación y zoom
        panOnScroll={false} // Desactivamos pan con scroll para permitir zoom
        zoomOnScroll={true} // CRUCIAL: Habilitamos zoom con rueda
        zoomOnPinch={true}  // Habilitamos zoom con pellizco en dispositivos táctiles
        panOnDrag={true}    // Habilitamos mover el canvas con arrastre
        // Importante: Evitar que el scroll afecte a la página cuando estamos en el editor
        preventScrolling={true}
        // Habilitar zoom con doble clic y establecer rangos de zoom
        zoomOnDoubleClick={true}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          background: 'transparent' /* SOLUCIÓN DEFINITIVA: Fondo transparente */
        }}
      >
        {/* Componente de corrección para forzar visibilidad de nodos */}
        {/* Componente NodeVisibilityFix eliminado */}
        {/* IMPORTANTE: BackgroundScene como fondo principal del editor */}
        <div
          className="ts-background-scene-container"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          zIndex: -5
        }}>
          <BackgroundScene isUltraMode={isUltraMode} />
        </div>
        
        {/* Controles de zoom y panorámica */}
        <Controls
          position="bottom-right"
          showInteractive={false}
          className="flow-controls"
        />
        
        {/* Mini mapa personalizado con versión mejorada */}
        <div className="flow-minimap-container bottom-left">
          <MiniMapWrapper
            nodes={nodes}
            edges={edges}
            isExpanded={false}
            isUltraMode={isUltraMode}
            viewport={{
              x: 0, 
              y: 0, 
              zoom: 1, 
              setViewport: (vp) => {
                if (reactFlowInstance && typeof reactFlowInstance.setViewport === 'function') {
                  reactFlowInstance.setViewport({
                    x: vp.x,
                    y: vp.y,
                    zoom: vp.zoom
                  });
                }
              }
            }}
            setByteMessage={(msg) => {
              console.log("[MiniMap]", msg);
            }}
          />
        </div>
        
        {/* Menús contextuales */}
        {menuOpen && menu === 'node' && selectedNode && (
          <NodeContextMenu
            position={menuPosition}
            onClose={() => setMenuOpen(false)}
          />
        )}
        
        {menuOpen && menu === 'edge' && selectedEdge && (
          <EdgeContextMenu
            position={menuPosition}
            onClose={() => setMenuOpen(false)}
          />
        )}
        
        {/* Indicador de métricas de rendimiento */}
        {nodes.length > 20 && (
          <div className="performance-metrics">
            <span className="perf-metric fps">
              FPS: {fpsRef.current}
            </span>
            <span className="perf-metric nodes">
              Nodos: {nodes.length}
            </span>
            {nodes.length > 50 && (
              <span className="perf-metric lod-stats">
                Nivel: <span className="high-detail">{optimizationLevel}</span>
              </span>
            )}
            {fpsRef.current < 30 && !isUltraMode && (
              <span className="perf-warning"> | Activar Ultra</span>
            )}
          </div>
        )}
        
        {/* Indicador de nivel de optimización adaptativa */}
        {optimizationLevel !== 'none' && (
          <div className={`optimization-indicator ${optimizationLevel}`}>
            MODO {optimizationLevel.toUpperCase()}
          </div>
        )}
      </ReactFlow>
      
      {/* Contenedor para los controles de la barra lateral - Posicionamiento absoluto para evitar reflow */}
      <div className="vertical-buttons-container" style={{
        position: 'absolute',
        top: '80px',
        right: '10px',
        zIndex: 999,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Botón Ultra Rendimiento - Versión estable */}
        <div className="button-group" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <button
            className={`editor-button ultra ${isUltraMode ? 'active' : ''} zoom-control-button`}
            onClick={handleToggleUltraMode}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(10, 20, 35, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              border: isUltraMode ? '1px solid rgba(227, 23, 227, 0.8)' : '1px solid rgba(0, 200, 224, 0.8)',
              boxShadow: isUltraMode ? '0 0 8px rgba(227, 23, 227, 0.5), 0 0 4px rgba(227, 23, 227, 0.3) inset' : '0 0 8px rgba(0, 200, 224, 0.5), 0 0 4px rgba(0, 200, 224, 0.3) inset'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="button-tooltip">Modo Ultra Rendimiento</div>
          </button>
        </div>
        
        <div className="button-spacer"></div>
        
        {/* Componente ZoomControls */}
        <ZoomControls
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        
        <div className="button-spacer"></div>
        
        {/* Botón de sincronización */}
        <div className="button-group">
          <button
            className="editor-button sync zoom-control-button"
            onClick={() => {
              try {
                // Guardar el flujo primero si es posible
                if (typeof handleSaveFlow === 'function') {
                  try {
                    handleSaveFlow();
                  } catch (saveError) {
                    console.warn('[FlowMain] Error al guardar antes de sincronizar:', saveError);
                    // Continuar con la sincronización de todas formas
                  }
                }
                
                console.log('[FlowMain] Abriendo modal de sincronización');
                
                // IMPORTANTE: Ya NO usamos el sistema local para evitar duplicación de modales
                // setShowSyncModal(true); // DESACTIVADO
                
                // Usamos SOLO el sistema global (GlobalProvider)
                try {
                  // Primero, intentamos usar la función openModal del GlobalProvider
                  if (typeof window.openModal === 'function') {
                    window.openModal('syncModal');
                  } else {
                    // Como respaldo, emitimos el evento personalizado
                    window.dispatchEvent(new CustomEvent('open-sync-modal'));
                  }
                } catch (e) {}
                
                // 3. Emitir evento global como respaldo
                try {
                  window.dispatchEvent(new CustomEvent('plubot-open-modal', {
                    detail: { modal: 'syncModal', source: 'FlowMain', timestamp: Date.now() }
                  }));
                } catch (e) {}
                
                // 4. Forzar apertura con un pequeño retraso para asegurar que el DOM esté listo
                setTimeout(() => {
                  setShowSyncModal(true);
                  console.log('[FlowMain] Forzando apertura del modal de sincronización');
                }, 100);
              } catch (error) {
                console.error('[FlowMain] Error al abrir modal de sincronización:', error);
                
                // Mostrar notificación de error como último recurso
                try {
                  if (typeof window.sendNotification === 'function') {
                    window.sendNotification('Error al abrir el modal de sincronización', 'error');
                  }
                } catch (e) {}
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9c-2.5 0-4.55-3.06-4.9-7H7.1m4 7c2.5 0 4.55-3.06 4.9-7h-9.8M3 12a9 9 0 0 1 9-9m-9 9c2.5 0 4.55 3.06 4.9 7h2.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="button-tooltip">Sincronizar flujo</div>
          </button>
        </div>
      </div>

      {/* Contenedor de modales con posición fija para evitar empujar contenido */}
      <div className="flow-editor-modals" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        {/* DESACTIVADO: SyncModal - Ya no se renderiza localmente para evitar duplicación
         * Ahora se maneja exclusivamente a través de GlobalProvider/ModalContainer 
         */}
        {/* {showSyncModal && (
          <div style={{ pointerEvents: 'auto' }}>
            <SyncModal
              onClose={() => setShowSyncModal(false)}
              onSync={onSave}
              project={plubotInfo}
              onNotify={(message, type) => {
                console.log('[SyncModal] Notificación:', message, type);
              }}
            />
          </div>
        )} */}
        
        {/* Modal de simulación - Activado desde el botón de EpicHeader */}
        {showSimulation && (
          <div style={{ pointerEvents: 'auto' }}>
            <SimulationInterface
              onClose={() => setShowSimulation(false)}
              flowId={flowId}
              plubotInfo={plubotInfo}
            />
          </div>
        )}
        
        {/* Modal de compartir (EmbedModal) - Activado desde EpicHeader */}
        {externalShowEmbedModal && (
          <div style={{ pointerEvents: 'auto' }}>
            <EmbedModal
              onClose={() => {
                console.log('[FlowMain] Cerrando modal EmbedModal');
                if (typeof externalCloseModal === 'function') {
                  externalCloseModal('embedModal');
                } else {
                  // Usar evento global como respaldo
                  window.dispatchEvent(new CustomEvent('plubot-close-modal', { 
                    detail: { modal: 'embedModal' } 
                  }));
                }
              }}
              plubotId={plubotInfo?.id || flowId}
              plubotName={plubotInfo?.name || 'Mi Chatbot'}
              flowData={{
                nodes: nodesMemo || [],
                edges: edgesMemo || []
              }}
              onExport={() => {
                console.log('[FlowMain] Exportando flujo desde EmbedModal');
                if (typeof handleExportFlow === 'function') {
                  handleExportFlow();
                } else if (typeof handleSaveFlow === 'function') {
                  handleSaveFlow();
                }
              }}
            />
          </div>
        )}
        
        {/* Modal de plantillas - Activado desde EpicHeader */}
        {externalShowTemplateSelector && (
          <div style={{ pointerEvents: 'auto' }}>
            <TemplateSelector
              onClose={() => {
                console.log('[FlowMain] Cerrando modal TemplateSelector');
                if (typeof externalCloseModal === 'function') {
                  externalCloseModal('templateSelector');
                } else {
                  // Usar evento global como respaldo
                  window.dispatchEvent(new CustomEvent('plubot-close-modal', { 
                    detail: { modal: 'templateSelector' } 
                  }));
                }
              }}
              onSelectTemplate={(template) => {
                console.log('[FlowMain] Template seleccionado:', template);
                // Aplicar el template seleccionado al flujo actual
                if (template && template.nodes && template.edges) {
                  // Intentar usar funciones de manejo de templates si existen
                  if (typeof applyTemplate === 'function') {
                    applyTemplate(template);
                  } else {
                    // Implementación básica de fallback
                    try {
                      // Asegurar que los nodos tengan IDs únicos
                      const newNodes = template.nodes.map(node => ({
                        ...node,
                        id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                      }));
                      
                      // Asegurar que las aristas referencien los nuevos IDs
                      const nodeIdMap = {};
                      template.nodes.forEach((node, index) => {
                        nodeIdMap[node.id] = newNodes[index].id;
                      });
                      
                      const newEdges = template.edges.map(edge => ({
                        ...edge,
                        id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        source: nodeIdMap[edge.source] || edge.source,
                        target: nodeIdMap[edge.target] || edge.target
                      }));
                      
                      setNodes(newNodes);
                      setEdges(newEdges);
                      
                      console.log('[FlowMain] Template aplicado correctamente');
                    } catch (error) {
                      console.error('[FlowMain] Error al aplicar template:', error);
                    }
                  }
                }
                
                // Cerrar el modal
                if (typeof externalCloseModal === 'function') {
                  externalCloseModal('templateSelector');
                } else {
                  window.dispatchEvent(new CustomEvent('plubot-close-modal', { 
                    detail: { modal: 'templateSelector' } 
                  }));
                }
              }}
              className="template-selector-modal"
            />
          </div>
        )}
        
        {/* Modal de opciones - Activado desde EpicHeader */}
        {externalShowImportExportModal && (
          <div style={{ pointerEvents: 'auto' }}>
            <ImportExportModal
              onClose={() => {
                console.log('[FlowMain] Cerrando modal ImportExportModal');
                if (typeof externalCloseModal === 'function') {
                  externalCloseModal('importExportModal');
                } else {
                  // Usar evento global como respaldo
                  window.dispatchEvent(new CustomEvent('plubot-close-modal', { 
                    detail: { modal: 'importExportModal' } 
                  }));
                }
              }}
              title="Opciones avanzadas de flujo"
              description="Importa o exporta tu flujo de conversación para compartirlo o guardarlo como respaldo."
              flowId={flowId}
              plubotInfo={plubotInfo}
              flowData={{
                nodes: nodesMemo || [],
                edges: edgesMemo || []
              }}
              onExport={() => {
                console.log('[FlowMain] Exportando flujo desde ImportExportModal');
                // Guardar antes de exportar
                if (typeof handleSaveFlow === 'function') {
                  try {
                    handleSaveFlow();
                    console.log('[FlowMain] Flujo guardado antes de exportar');
                  } catch (error) {
                    console.error('[FlowMain] Error al guardar flujo antes de exportar:', error);
                  }
                }
                
                // Exportar el flujo si existe la función
                if (typeof handleExportFlow === 'function') {
                  try {
                    handleExportFlow();
                    console.log('[FlowMain] Flujo exportado correctamente');
                  } catch (error) {
                    console.error('[FlowMain] Error al exportar flujo:', error);
                  }
                } else {
                  // Implementación básica de exportación como fallback
                  try {
                    const exportData = {
                      nodes: nodesMemo || [],
                      edges: edgesMemo || [],
                      metadata: {
                        exportDate: new Date().toISOString(),
                        flowId: flowId,
                        plubotName: plubotInfo?.name || 'Mi Chatbot'
                      }
                    };
                    
                    const jsonString = JSON.stringify(exportData, null, 2);
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `flujo-${plubotInfo?.name || 'plubot'}-${new Date().toISOString().slice(0,10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    console.log('[FlowMain] Flujo exportado mediante fallback');
                  } catch (error) {
                    console.error('[FlowMain] Error en exportación fallback:', error);
                  }
                }
              }}
              onImport={(data) => {
                console.log('[FlowMain] Importando flujo desde ImportExportModal');
                if (data && data.nodes && data.edges) {
                  try {
                    // Intentar usar la función de importación si existe
                    if (typeof handleImportFlow === 'function') {
                      handleImportFlow(data);
                      console.log('[FlowMain] Flujo importado correctamente mediante función');
                    } else {
                      // Implementación básica de fallback
                      // Asegurar que los nodos tienen IDs únicos
                      const newNodes = data.nodes.map(node => ({
                        ...node,
                        id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                      }));
                      
                      // Asegurar que las aristas referencien los nuevos IDs
                      const nodeIdMap = {};
                      data.nodes.forEach((node, index) => {
                        nodeIdMap[node.id] = newNodes[index].id;
                      });
                      
                      const newEdges = data.edges.map(edge => ({
                        ...edge,
                        id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        source: nodeIdMap[edge.source] || edge.source,
                        target: nodeIdMap[edge.target] || edge.target
                      }));
                      
                      setNodes(newNodes);
                      setEdges(newEdges);
                      console.log('[FlowMain] Flujo importado correctamente mediante fallback');
                    }
                    
                    // Cerrar el modal
                    if (typeof externalCloseModal === 'function') {
                      externalCloseModal('importExportModal');
                    } else {
                      window.dispatchEvent(new CustomEvent('plubot-close-modal', { 
                        detail: { modal: 'importExportModal' } 
                      }));
                    }
                    
                  } catch (error) {
                    console.error('[FlowMain] Error al importar flujo:', error);
                  }
                } else {
                  console.warn('[FlowMain] Datos de importación inválidos:', data);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowMain;

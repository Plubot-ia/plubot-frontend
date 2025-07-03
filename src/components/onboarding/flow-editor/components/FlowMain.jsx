/**
 * FlowMain.jsx
 * Orquestador visual del editor de flujos
 * Responsable de renderizar nodos y conexiones usando ReactFlow
 *
 * @version 2.0.0
 */

import PropTypes from 'prop-types';
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useLayoutEffect,
} from 'react';
// ReactFlow y sus componentes
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
} from 'reactflow';
import 'reactflow/dist/style.css';

// SOLUCIÓN UNIFICADA: Un solo archivo para todos los fixes sin necesidad de múltiples scripts
import '../utils/optimized-flow-fixes';
// SOLUCIÓN MINIMALISTA: Solo hace transparente el pane sin afectar nada más
import './transparent-pane.css';

// Importar el gestor de modo ultra rendimiento
// La gestión del modo ultra ahora es manejada exclusivamente por el store Zustand.

// Zustand Store - acceso optimizado con selectores
import useResizeObserver from 'use-resize-observer';

import EmbedModal from '@/components/onboarding/modals/EmbedModal';
import ImportExportModal from '@/components/onboarding/modals/ImportExportModal';
import ActionNode from '@/components/onboarding/nodes/actionnode/ActionNode';
import DecisionNode from '@/components/onboarding/nodes/decisionnode/DecisionNode';
import EndNode from '@/components/onboarding/nodes/endnode/EndNode';
import HttpRequestNode from '@/components/onboarding/nodes/httprequestnode/HttpRequestNode';
import MessageNode from '@/components/onboarding/nodes/messagenode/MessageNode';
import OptionNode from '@/components/onboarding/nodes/optionnode/OptionNode';
import PowerNode from '@/components/onboarding/nodes/powernode/PowerNode';
import StartNode from '@/components/onboarding/nodes/startnode/StartNode';
import {
  createNodeTypes,
  edgeTypes as sharedEdgeTypes,
} from '@/flow/nodeRegistry.jsx';
import useGlobalContext from '@/hooks/useGlobalContext';
import useFlowStore from '@/stores/use-flow-store';

import { calculateCorrectDropPosition } from '../drop-position-fix';
import useAdaptivePerformance from '../hooks/useAdaptivePerformance';
import useNodeVirtualization from '../hooks/useNodeVirtualization'; // ¡El nuevo hook de virtualización!
import BackgroundScene from '../ui/BackgroundScene';
import CustomMiniMap from '../ui/CustomMiniMap';
import ZoomControls from '../ui/ZoomControls';
import {
  NODE_EXTENT,
  TRANSLATE_EXTENT,
  MIN_ZOOM,
  MAX_ZOOM,
} from '../utils/flow-extents';
import { getLODLevel, LOD_LEVELS } from '../utils/lodUtils'; // Importar utilidades LOD

import EdgeContextMenu from './menus/EdgeContextMenu';
import NodeContextMenu from './menus/NodeContextMenu';
import MiniMapWrapper from './MiniMapWrapper';

// Hooks específicos para optimización y rendimiento

// Componentes de UI

// Importar modales

// Importar utilidades

// Importar definiciones de límites para el canvas y los nodos

// Importar shared node registry

// Componentes de nodos - importados directamente para asegurar que se cargan como corresponde

// Estilos CSS necesarios para el funcionamiento del componente
import '../ui/elite-drag-optimizations.css';
// Consolidated overrides for staging
import '../react-flow-overrides.css';
// Importar soluciones para eliminar estilos de debugging
import '../ui/remove-debug-styles.css';
import '../ui/hide-debug-elements.css'; // Solución adicional para garantizar que no haya elementos de depuración visibles
import '../ui/mega-drag-fix.css'; // Solución definitiva de arrastre para garantizar que no haya elementos de depuración visibles

// Componentes esenciales
import StorageQuotaManager from './StorageQuotaManager';
// import HideControls from './HideControls'; // Eliminado para optimización

// Estilos para controles del editor
import '../ui/ZoomControls.css';
import '../ui/VerticalButtons.css';
import '../ui/EliteEdge.css';
import '../ui/FlowControls.css';
import '../ui/HistoryControls.css';
import '../ui/SyncButton.css';
import '../ui/UltraMode.css';

// Optimización: Todas las funciones de corrección vienen de optimized-flow-fixes
// Las importaciones se realizan en la parte superior del archivo
import { fixNodePositions } from '../utils/fix-node-positions';
// Importar solución para el posicionamiento correcto de nodos
// Importar el sistema de garantía de interacción de nodos
import {
  ensureNodesAreInteractive,
  setupNodeInteractionObserver,
  stopNodeInteractionObserver,
} from '../utils/ensure-node-interaction';
// Importar el sanitizador de paths de aristas

// Importar estilos CSS para posicionamiento de nodos
import '../node-positioning.css';

// Importar el nuevo validador de posiciones de nodos
import {
  validateNodePositions,
  sanitizeEdgePaths,
} from '../utils/node-position-validator';
// Importar y aplicar automáticamente el parche de validación de posiciones

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
  onNodeDragStart: externalOnNodeDragStart,
  onEdgeUpdateEnd: externalOnEdgeUpdateEnd,
  onNodesDelete: externalOnNodesDelete,
  onEdgesDelete: externalOnEdgesDelete,
  onSelectionChange: externalOnSelectionChange,
  onNodeDrag: externalOnNodeDrag,
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
  const flowContainerReference = useRef();
  const reactFlowInstanceReference = useRef();
  const isInitialLoad = useRef(true);
  const nodeCache = useRef(new Map());
  const edgeCache = useRef(new Map());

  // Referencias para el estado del sistema
  // Nota: Las referencias de rendimiento ahora se manejan en useAdaptivePerformance

  // Estado local para menús contextuales y modales
  const [menuOpen, setMenuOpen] = useState(false);
  const [menu, setMenu] = useState();
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const { fitView } = useReactFlow();

  const { showNotification } = useGlobalContext();
  const [selectedNode, setSelectedNode] = useState();
  const [selectedEdge, setSelectedEdge] = useState();
  const [isDragging, setIsDragging] = useState(false);
  const [lodLevel, setLodLevel] = useState(LOD_LEVELS.FULL); // Estado para el nivel de detalle

  // Estados para modales internos (solo los que no vienen de props)
  const [showSyncModal, setShowSyncModal] = useState(false);

  // La virtualización ahora es gestionada por el hook useNodeVirtualization.

  // -----------------------------------------
  // ACCESO AL STORE DE ZUSTAND (SELECTORES)
  // -----------------------------------------
  // Selectores optimizados para minimizar renderizaciones
  const zustandNodes = useFlowStore((state) => state.nodes);
  const zustandEdges = useFlowStore((state) => state.edges);
  const isUltraMode = useFlowStore((state) => state.isUltraMode);
  const plubotId = useFlowStore((state) => state.plubotId);
  const flowName = useFlowStore((state) => state.flowName);
  const isNodeBeingDragged = useFlowStore((state) => state.isNodeBeingDragged);

  // Flag de estado para controlar la renderización de las aristas y evitar condiciones de carrera.
  const [areEdgesReady, setAreEdgesReady] = useState(false);

  // WORKAROUND: Soluciona una condición de carrera en la rehidratación.
  // Se retrasa la renderización de las aristas para dar tiempo a los nodos a registrar sus handles.
  useEffect(() => {
    // Se establece un temporizador que cambiará el estado a 'listo' después de un breve retraso.
    // Esto asegura que el primer renderizado se complete solo con los nodos.
    const timer = setTimeout(() => {
      setAreEdgesReady(true);
    }, 150); // Retraso aumentado para mayor robustez en entornos complejos.

    // Limpieza del temporizador si el componente se desmonta antes de que se complete.
    return () => clearTimeout(timer);
  }, []); // El array de dependencias vacío asegura que se ejecute solo una vez, al montar.

  // Acciones del store con memoización
  const setReactFlowInstanceFromStore = useFlowStore(
    (state) => state.setReactFlowInstance,
  );
  const {
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    toggleUltraMode,
    undo,
    redo,
    canUndo,
    canRedo,
    setIsNodeBeingDragged,
    hideContextMenu,
  } = useFlowStore();

  // Determinar si se están usando nodos externos o internos
  const nodes = externalNodes || zustandNodes;
  const edges = areEdgesReady ? externalEdges || zustandEdges : [];

  // Efecto para centrar la vista únicamente en la carga inicial del flujo.
  // Esto evita el reajuste automático al mover nodos, dando control total al usuario.
  useEffect(() => {
    // Solo se ejecuta si es la carga inicial, hay nodos y la función fitView está disponible.
    if (isInitialLoad.current && nodes.length > 0 && fitView) {
      fitView({ duration: 250, padding: 0.1 }); // Animación suave y un poco de padding
      isInitialLoad.current = false; // Marcamos que la carga inicial ya pasó.
    }
  }, [nodes, fitView]); // Depende de los nodos para asegurar que se ejecuta cuando ya están cargados.

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
    getStats,
  } = useAdaptivePerformance();

  // Estadísticas de rendimiento accesibles en la UI

  // Obtener estilos para nodos
  // Instancia de ReactFlow para operaciones de viewport
  const reactFlowInstance = useReactFlow();

  // --- NUEVO SISTEMA DE VIRTUALIZACIÓN DE ALTO RENDIMIENTO ---
  const {
    ref: flowWrapperReference,
    width: containerWidth,
    height: containerHeight,
  } = useResizeObserver();
  const viewport = useViewport();

  // El corazón de la nueva arquitectura: el hook de virtualización
  const { visibleNodes, visibleEdges } = useNodeVirtualization({
    nodes,
    edges,
    viewport,
    containerDimensions: { width: containerWidth, height: containerHeight },
    // Opciones adicionales para el hook de virtualización si fueran necesarias
  });

  // --- GESTIÓN CENTRALIZADA DE LOD CON HISTÉRESIS CORREGIDA ---

  // Jerarquía numérica para una comparación lógica correcta de los niveles de LOD.
  const lodHierarchy = {
    [LOD_LEVELS.FULL]: 2,
    [LOD_LEVELS.COMPACT]: 1,
    [LOD_LEVELS.MINI]: 0,
  };

  const hysteresisTimer = useRef();

  // Efecto para gestionar el Nivel de Detalle (LOD) con histéresis.
  useEffect(() => {
    // Aquí se podrían pasar umbrales personalizados si se cargaran desde una config.
    const newLodLevel = getLODLevel(viewport.zoom);

    if (newLodLevel !== lodLevel) {
      clearTimeout(hysteresisTimer.current);

      const currentNumericLod = lodHierarchy[lodLevel];
      const newNumericLod = lodHierarchy[newLodLevel];

      // Si el nuevo nivel es MÁS detallado (número mayor), actualiza inmediatamente.
      setLodLevel(newLodLevel);
    }

    return () => clearTimeout(hysteresisTimer.current);
  }, [viewport.zoom, lodLevel]);

  // INSTRUMENTATION: Log canvas zoom and LOD changes
  useEffect(() => {}, [viewport.zoom, lodLevel]);

  // INSTRUMENTATION: Log canvas panning
  useEffect(() => {}, [viewport.x, viewport.y]);

  // Inyectar el nivel de LOD calculado centralmente en los nodos visibles.
  const nodesWithLOD = useMemo(() => {
    return visibleNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        lodLevel, // Inyectar el nivel de LOD desde el estado centralizado.
      },
    }));
  }, [visibleNodes, lodLevel]);

  // Inyectar el nivel de LOD en las aristas visibles para sincronizar su apariencia.
  const edgesWithLOD = useMemo(() => {
    return visibleEdges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        lodLevel, // Inyectar el mismo lodLevel que a los nodos.
      },
    }));
  }, [visibleEdges, lodLevel]);

  // INSTRUMENTATION: Log virtualization stats
  useEffect(() => {}, [
    visibleNodes.length,
    nodes.length,
    visibleEdges.length,
    edges.length,
  ]);
  // --- FIN DEL NUEVO SISTEMA DE VIRTUALIZACIÓN ---

  // -----------------------------------------
  // TIPOS DE NODOS Y ARISTAS
  // -----------------------------------------
  const nodeTypes = useMemo(() => {
    // Si se proporcionan tipos de nodos externos, se usan directamente.
    if (externalNodeTypes) {
      return externalNodeTypes;
    }
    // De lo contrario, se crean los tipos de nodo estándar.
    // El modo Ultra y el LOD se gestionan inyectando `lodLevel` en los datos de cada nodo,
    // por lo que no es necesario un HOC (`withLOD`) aquí.
    return createNodeTypes(false); // `false` indica que no estamos en modo ultra a nivel de tipo de nodo.
  }, [externalNodeTypes]);

  // 3. Se memoizan los tipos de aristas.
  const edgeTypes = useMemo(() => {
    // Si se proporcionan tipos de aristas externos, se usan directamente.
    if (externalEdgeTypes) {
      return externalEdgeTypes;
    }
    // De lo contrario, se utilizan los tipos de aristas compartidos.
    // El LOD se gestiona a través de las props de las aristas, por lo que no se necesita HOC.
    return sharedEdgeTypes;
  }, [externalEdgeTypes]);

  // -----------------------------------------
  // MANEJADORES DE EVENTOS
  // -----------------------------------------
  /**
   * Manejador para cambios en nodos
   * @param {Array} changes - Cambios a aplicar a los nodos
   */
  const handleNodesChange = useCallback(
    (changes) => {
      if (externalOnNodesChange) {
        externalOnNodesChange(changes);
      } else {
        onNodesChange(changes);
      }
    },
    [externalOnNodesChange, onNodesChange],
  );

  /**
   * Manejador para cambios en aristas
   * Permite actualizar el estado global
   * @param {Array} changes - Cambios en las aristas
   */
  const handleEdgesChange = useCallback(
    (changes) => {
      // Sanitizar paths de aristas antes de aplicar los cambios
      const sanitizedChanges = changes.map((change) => {
        // Si el cambio es del tipo 'add' y tiene un item con data.path, sanitizar el path
        if (
          change.type === 'add' &&
          change.item &&
          change.item.data &&
          change.item.data.path
        ) {
          return {
            ...change,
            item: {
              ...change.item,
              data: {
                ...change.item.data,
                path: change.item.data.path.replaceAll('NaN', '0'),
              },
            },
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
    },
    [externalOnEdgesChange, onEdgesChange],
  );

  /**
   * Manejador para conexiones entre nodos
   * @param {Object} params - Parámetros de la conexión
   */
  const handleConnect = useCallback(
    (parameters) => {
      if (externalOnConnect) {
        externalOnConnect(parameters);
      } else {
        onConnect(parameters);
      }
    },
    [externalOnConnect, onConnect],
  );

  /**
   * Manejador para clic en nodo
   * @param {Event} event - Evento del clic
   * @param {Object} node - Nodo seleccionado
   */
  const handleNodeClick = useCallback(
    (event, node) => {
      if (externalOnNodeClick) {
        externalOnNodeClick(event, node);
      } else {
        setSelectedNode(node);
        setMenuOpen(false);
      }
    },
    [externalOnNodeClick],
  );

  /**
   * Manejador para clic en el panel
   * @param {Event} event - Evento del clic
   */
  const handlePaneClick = useCallback(
    (event) => {
      // Ocultar el menú contextual al hacer clic en el panel
      hideContextMenu();

      if (externalOnPaneClick) {
        externalOnPaneClick(event);
      } else {
        setSelectedNode(undefined);
        setSelectedEdge(null);
        setMenuOpen(false);
      }
    },
    [externalOnPaneClick, hideContextMenu],
  );

  /**
   * Manejador para clic en arista
   * @param {Event} event - Evento del clic
   * @param {Object} edge - Arista seleccionada
   */
  const handleEdgeClick = useCallback(
    (event, edge) => {
      if (externalOnEdgeClick) {
        externalOnEdgeClick(event, edge);
      } else {
        event.stopPropagation();
        setSelectedEdge(edge);
        setMenuOpen(true);
        setMenu('edge');
        setMenuPosition({
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    [externalOnEdgeClick],
  );

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setSelectedNode(node);
    setMenu('node');
    setMenuPosition({ x: event.clientX, y: event.clientY });
    setMenuOpen(true);
  }, []);

  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    setSelectedEdge(edge);
    setMenu('edge');
    setMenuPosition({ x: event.clientX, y: event.clientY });
    setMenuOpen(true);
  }, []);

  const onNodeDragStart = useCallback((event, node) => {
    setIsDragging(true);
    setIsNodeBeingDragged(true);
    document.body.classList.add('elite-node-dragging');
    if (externalOnNodeDragStart) {
      externalOnNodeDragStart(event, node);
    }
  }, [externalOnNodeDragStart, setIsNodeBeingDragged]);

  const onNodeDrag = useCallback((event, node) => {
    if (externalOnNodeDrag) {
      externalOnNodeDrag(event, node);
    }
  }, [externalOnNodeDrag]);

  const onEdgeUpdateStart = useCallback((event, edge) => {
    if (externalOnEdgeUpdateStart) {
      externalOnEdgeUpdateStart(event, edge);
    }
  }, [externalOnEdgeUpdateStart]);

  const onEdgeUpdateEnd = useCallback((event, edge) => {
    if (externalOnEdgeUpdateEnd) {
      externalOnEdgeUpdateEnd(event, edge);
    }
  }, [externalOnEdgeUpdateEnd]);

  const onNodesDelete = useCallback((nodes) => {
    if (externalOnNodesDelete) {
      externalOnNodesDelete(nodes);
    }
  }, [externalOnNodesDelete]);

  const onEdgesDelete = useCallback((edges) => {
    if (externalOnEdgesDelete) {
      externalOnEdgesDelete(edges);
    }
  }, [externalOnEdgesDelete]);

  const onSelectionChange = useCallback(
    (parameters) => {
      // Lógica unificada para manejar el cambio de selección, evitando procesamiento durante el arrastre.
      const shouldProcess = !isDragging;

      if (externalOnSelectionChange) {
        if (shouldProcess) {
          externalOnSelectionChange(parameters);
        }
      } else {
        const selectedNodeId = selectedNode?.id;
        const newSelectedNodeId = parameters?.nodes?.[0]?.id;

        if (shouldProcess && selectedNodeId !== newSelectedNodeId) {
          if (parameters?.nodes?.length > 0) {
            setSelectedNode(parameters.nodes[0]);
          } else {
            setSelectedNode(undefined);
          }
        }
      }
    },
    [externalOnSelectionChange, isDragging, selectedNode, setSelectedNode],
  );

  /**
   * Manejador para clic derecho en nodo (menú contextual)
   * @param {Event} event - Evento del clic
   * @param {Object} node - Nodo seleccionado
   */

  /**
   * Manejador para fin de arrastre de nodo
   * @param {Event} event - Evento de arrastre
   * @param {Object} node - Nodo arrastrado
   */
  // Crear un sistema de debounce para las validaciones de posición
  const validationDebounceReference = useRef(null);

  const handleNodeDragStop = useCallback(
    (event, node) => {
      // Este evento se dispara cuando el usuario termina de arrastrar un nodo
      setIsDragging(false);

      // IMPORTANTE: Restablecer la bandera de arrastre en progreso
      // para permitir que el sistema de validación funcione normalmente - FORMA SEGURA
      setIsNodeBeingDragged(false);

      // ULTRA IMPORTANTE: Quitar la clase del body para volver a la normalidad - FORMA SEGURA
      try {
        document.body.classList.remove('elite-node-dragging'); // Corregir nombre de la clase
      } catch {
        // Manejar error de forma silenciosa
      }

      // Validación pospuesta - solo al final del arrastre
      // Esto mejora drásticamente el rendimiento al mover nodos
      if (validationDebounceReference.current) {
        clearTimeout(validationDebounceReference.current);
      }

      // Retrasar ligeramente la validación para garantizar fluidez
      validationDebounceReference.current = setTimeout(() => {
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

        validationDebounceReference.current = null;
      }, 200); // Aumentar ligeramente el retraso para garantizar mayor fluidez

      if (externalOnNodeDragStop) {
        externalOnNodeDragStop(event, node);
      }
    },
    [externalOnNodeDragStop, setIsNodeBeingDragged],
  );

  /**
   * Manejador para fin de arrastre de selección
   * @param {Event} event - Evento de arrastre
   * @param {Array} nodes - Nodos seleccionados
   */
  const handleSelectionDragStop = useCallback(
    (event, nodes) => {
      if (externalOnSelectionDragStop) {
        externalOnSelectionDragStop(event, nodes);
      }
    },
    [externalOnSelectionDragStop],
  );

  /**
   * Manejador para arrastrar sobre el panel
   * @param {Event} event - Evento de arrastre
   */
  const handleDragOver = useCallback(
    (event) => {
      if (externalOnDragOver) {
        externalOnDragOver(event);
      } else {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }
    },
    [externalOnDragOver],
  );

  /**
   * Manejador para soltar en el panel
   * @param {Event} event - Evento de soltar
   */
  /**
   * Manejador de drop usando calculateCorrectDropPosition del módulo drop-position-fix
   */
  const handleDrop = useCallback(
    (event) => {
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
      } catch {
        // Error handling without logging
      }
    },
    [externalOnDrop],
  );

  /**
   * Manejador para actualización de arista
   * @param {Object} oldEdge - Arista anterior
   * @param {Object} newConnection - Nueva conexión
   */
  const handleEdgeUpdate = useCallback(
    (oldEdge, newConnection) => {
      if (externalOnEdgeUpdate) {
        externalOnEdgeUpdate(oldEdge, newConnection);
      }
    },
    [externalOnEdgeUpdate],
  );

  /**
   * Manejador para inicio de actualización de arista
   */

  /**
   * Manejador para fin de actualización de arista
   * @param {Event} event - Evento de actualización
   * @param {Object} edge - Arista actualizada
   */

  /**
   * Validador de conexiones entre nodos
   * @param {Object} connection - Conexión a validar
   * @returns {boolean} - true si la conexión es válida
   */
  const isValidConnection = useCallback(
    (connection) => {
      // Siempre delegar a externalValidConnectionsHandles si se proporciona.
      // Esta función ahora vendrá de useHandleValidator en FlowEditor.jsx y contendrá toda la lógica.
      if (typeof externalValidConnectionsHandles === 'function') {
        return externalValidConnectionsHandles(connection);
      }

      // Fallback MUY permisivo si no se proporciona un validador externo (no debería ocurrir en este proyecto).
      return true;
    },
    [externalValidConnectionsHandles],
  );

  // -----------------------------------------
  // FUNCIONES AUXILIARES
  // -----------------------------------------
  /**
   * Funciones para gestionar los modales
   */

  /**
   * Manejador optimizado para alternar modo Ultra Rendimiento
   * Usa el sistema centralizado UltraModeManager
   */
  const handleToggleUltraMode = useCallback(() => {
    // Buscar contenedor de botones
    const buttonsContainer = document.querySelector(
      '.editor-controls-container',
    );

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
        if (isUltraMode) {
          ultraButton.style.border = '1px solid rgba(0, 200, 224, 0.8)';
          ultraButton.style.boxShadow =
            '0 0 8px rgba(0, 200, 224, 0.5), 0 0 4px rgba(0, 200, 224, 0.3) inset';
        } else {
          ultraButton.style.border = '1px solid rgba(227, 23, 227, 0.8)';
          ultraButton.style.boxShadow =
            '0 0 8px rgba(227, 23, 227, 0.5), 0 0 4px rgba(227, 23, 227, 0.3) inset';
        }
      }

      // 2. Cambiar el estado en el store
      toggleUltraMode();

      // 3. Usar el UltraModeManager para gestionar todas las animaciones
      // if (isUltraMode) {
      //   // Desactivando modo ultra - restaurar animaciones
      //   restoreAnimations(); // Deprecado: La lógica de animación ahora es manejada por CSS y el store.
      // } else {
      //   // Activando modo ultra - detener animaciones
      //   stopAllAnimations(true); // Deprecado: La lógica de animación ahora es manejada por CSS y el store.
      // }

      // 4. Permitir nuevas interacciones después de un tiempo
      setTimeout(() => {
        buttonsContainer.dataset.transitioning = 'false';
      }, 100); // Reducido para mayor fluidez
    } else {
      // Si no encontramos el contenedor, usar solo el sistema centralizado
      // La única responsabilidad del atajo de teclado es invocar la acción del store.
      // El store se encarga de la lógica interna, incluyendo la manipulación del DOM.
      toggleUltraMode();
    }
  }, [toggleUltraMode, isUltraMode]);

  /**
   * Objeto con información del plubot para los modales
   */
  const plubotInfo = useMemo(
    () => ({
      id: project?.id || plubotId,
      name: project?.name || flowName || 'Flujo sin nombre',
    }),
    [project, plubotId, flowName],
  );

  // ID del flujo (igual al ID del plubot)
  const flowId = project?.id || plubotId;

  // Aplicar solución unificada para todos los problemas de ReactFlow
  useEffect(() => {
    // Importamos la solución optimizada
    // import('../utils/optimized-flow-fixes').then(({ initOptimizedFixes }) => {
    // Configuración mínima: sin logs y con intervalo largo para mejor rendimiento
    /*      const cleanup = initOptimizedFixes({
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
      // Error al inicializar fixes optimizados
    }); */
  }, []); // Sin dependencias para ejecutarse solo al montar/desmontar

  /**
   * Efecto para sincronizar instancia de ReactFlow
   */
  useEffect(() => {
    if (incomingReactFlowInstance) {
      reactFlowInstanceReference.current = incomingReactFlowInstance;
    }
  }, [incomingReactFlowInstance]);

  /**
   * Efecto para iniciar el sistema de monitoreo de rendimiento
   */
  useEffect(() => {
    // Iniciar el sistema de monitoreo de rendimiento adaptativo
    const cleanup = startMonitoring(nodes, edges);

    // Actualizar el rendimiento con el viewport actual
    if (reactFlowInstance) {
      const viewport = reactFlowInstance.getViewport();
      updatePerformance(viewport);
    }

    return cleanup;
  }, [nodes, edges, startMonitoring, updatePerformance, reactFlowInstance]);

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
        if (
          updatedNodes &&
          updatedNodes !== nodes &&
          typeof setNodes === 'function'
        ) {
          setNodes(updatedNodes);
        }
      } catch {
        // Error handling without logging
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

      // Detener el sistema de garantía de interacción de nodos
      stopNodeInteractionObserver();
    };
  }, []);

  // Efecto para manejar el montaje y desmontaje del simulador
  useEffect(() => {
    return () => {
      // Limpiar cualquier estado o referencia al simulador al desmontar
      if (reactFlowInstanceReference.current) {
        reactFlowInstanceReference.current = null;
      }
    };
  }, []);

  // La lógica de virtualización ahora está centralizada en el hook useNodeVirtualization
  // y se actualiza reactivamente. No se necesita lógica adicional aquí.

  // -----------------------------------------
  // RENDERIZADO
  // -----------------------------------------
  return (
    <div
      className='flow-main'
      ref={flowContainerReference}
      style={{ width: '100%', height: '100%', minHeight: '500px' }}
    >
      {/* Gestor de cuota de almacenamiento - componente invisible que limpia localStorage */}
      <StorageQuotaManager project={project} />

      {/* SOLUCIÓN DIRECTA: ReactFlow con configuración optimizada para posicionamiento correcto */}
      <div
        className='flow-main-container'
        ref={flowWrapperReference}
        style={{ width: '100%', height: '100%' }}
      >
        <ReactFlow
          nodes={nodesWithLOD} // Usar nodos con LOD inyectado
          edges={edgesWithLOD} // Usar aristas con LOD inyectado
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onPaneClick={handlePaneClick}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onInit={(instance) => {
            // Guardar la instancia
            reactFlowInstanceReference.current = instance;
            if (globalThis.window !== undefined) {
              globalThis.reactFlowInstance = instance;
            }
            setReactFlowInstanceFromStore(instance);

            // Si hay una función externa para establecer la instancia, llamarla
            if (typeof externalSetReactFlowInstance === 'function') {
              externalSetReactFlowInstance(instance);
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}

          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onNodeDragStop={handleNodeDragStop}

          onEdgeUpdate={handleEdgeUpdate}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onEdgeUpdateStart={onEdgeUpdateStart}
          onEdgeUpdateEnd={onEdgeUpdateEnd}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onSelectionChange={onSelectionChange}
          fitView={false}
          snapToGrid={false}
          snapGrid={[15, 15]}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Control', 'Meta']}
          selectionKeyCode='Shift'
          panActivationKeyCode='Space'
          zoomActivationKeyCode='Meta'
          connectionRadius={75}
          maxZoom={MAX_ZOOM}
          minZoom={minZoom}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }} // Corregido para usar defaultViewport
          nodeExtent={[
            [-50_000, -50_000],
            [50_000, 50_000],
          ]} /* Configuración ampliada para máxima libertad de posicionamiento */
          translateExtent={[
            [-50_000, -50_000],
            [50_000, 50_000],
          ]} /* Configuración ampliada para permitir panear libremente */
          proOptions={{ hideAttribution: true }}
          className='flow-main-canvas'
          onlyRenderVisibleElements={
            false
          } /* IMPORTANTE: Mantener desactivado para mostrar todos los nodos */
          isValidConnection={isValidConnection}
          fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }}
          autoPanOnConnect={false}
          autoPanOnNodeDrag={false}
          attributionPosition='bottom-right'
          elementsSelectable
          defaultEdgeOptions={{ zIndex: 0 }}
          nodesDraggable
          nodesConnectable
          // SOLUCIÓN MEJORADA: Configuración optimizada para navegación y zoom
          panOnScroll={false} // Desactivamos pan con scroll para permitir zoom
          zoomOnScroll // CRUCIAL: Habilitamos zoom con rueda
          zoomOnPinch // Habilitamos zoom con pellizco en dispositivos táctiles
          panOnDrag // Habilitamos mover el canvas con arrastre
          // Importante: Evitar que el scroll afecte a la página cuando estamos en el editor
          preventScrolling
          // Habilitar zoom con doble clic y establecer rangos de zoom
          zoomOnDoubleClick
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            background:
              'transparent' /* SOLUCIÓN DEFINITIVA: Fondo transparente */,
          }}
        >
          {/* Componente de corrección para forzar visibilidad de nodos */}
          {/* Componente NodeVisibilityFix eliminado */}
          {/* IMPORTANTE: BackgroundScene como fondo principal del editor */}
          <div
            className='ts-background-scene-container'
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: -5,
            }}
          >
            <BackgroundScene isUltraMode={isUltraMode} />
          </div>

          {/* Mini mapa personalizado con versión mejorada */}
          <div className='flow-minimap-container bottom-left'>
            <MiniMapWrapper
              nodes={visibleNodes}
              edges={visibleEdges} // Usar solo las aristas visibles
              isExpanded={false}
              isUltraMode={isUltraMode}
              viewport={{}}
              setByteMessage={() => {
                /* intencionalmente vacío */
              }}
            />
          </div>

          {/* Controles de zoom y utilidades - Renderizado estable */}
          <Controls
            showInteractive={false}
            showFitView={false}
            showZoom={false}
            style={{ zIndex: 9999 }} // Asegurar que esté por encima de otros elementos
          />

          {/* Minimapa personalizado con optimizaciones */}
          <CustomMiniMap
            isUltraMode={isUltraMode}
            optimizationLevel={optimizationLevel}
          />

          {/* Monitor de rendimiento - Opcional */}
          {typeof process !== 'undefined' &&
            process.env.NODE_ENV === 'development' && (
              <div className='perf-monitor'>
                FPS: {fpsRef.current.toFixed(1)}
                {fpsRef.current < 30 && !isUltraMode && (
                  <span className='perf-warning'> | Activar Ultra</span>
                )}
              </div>
            )}

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

          {/* Indicador de nivel de optimización adaptativa */}
          {optimizationLevel !== 'none' && (
            <div className={`optimization-indicator ${optimizationLevel}`}>
              MODO {optimizationLevel.toUpperCase()}
            </div>
          )}
        </ReactFlow>
      </div>

      {/* Contenedor para los controles de la barra lateral - Posicionamiento absoluto para evitar reflow */}
      <div
        className='vertical-buttons-container'
        style={{
          position: 'absolute',
          top: '80px',
          right: '10px',
          zIndex: 999,
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Botón Ultra Rendimiento - Versión estable */}
        <div
          className='button-group'
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
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
              border: isUltraMode
                ? '1px solid rgba(227, 23, 227, 0.8)'
                : '1px solid rgba(0, 200, 224, 0.8)',
              boxShadow: isUltraMode
                ? '0 0 8px rgba(227, 23, 227, 0.5), 0 0 4px rgba(227, 23, 227, 0.3) inset'
                : '0 0 8px rgba(0, 200, 224, 0.5), 0 0 4px rgba(0, 200, 224, 0.3) inset',
            }}
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M13 2L3 14H12L11 22L21 10H12L13 2Z'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            <div className='button-tooltip'>Modo Ultra Rendimiento</div>
          </button>
        </div>

        <div className='button-spacer' />

        {/* Componente ZoomControls */}
        <ZoomControls
          onUndo={undo}
          onRedo={redo}
          onZoomIn={() => reactFlowInstance.zoomIn({ duration: 300 })}
          onZoomOut={() => reactFlowInstance.zoomOut({ duration: 300 })}
          onFitView={() =>
            reactFlowInstance.fitView({ duration: 300, padding: 0.1 })
          }
          canUndo={canUndo}
          canRedo={canRedo}
        />

        <div className='button-spacer' />

        {/* Modal de compartir (EmbedModal) - Activado desde EpicHeader */}
        {externalShowEmbedModal && (
          <div style={{ pointerEvents: 'auto' }}>
            <EmbedModal
              onClose={() => {
                if (typeof externalCloseModal === 'function') {
                  externalCloseModal('embedModal');
                } else {
                  globalThis.dispatchEvent(
                    new CustomEvent('plubot-close-modal', {
                      detail: { modal: 'embedModal' },
                    }),
                  );
                }
              }}
              plubotId={flowId}
              customization={plubotInfo?.customization}
            />
          </div>
        )}

        {/* Modal de importar/exportar - Activado desde EpicHeader */}
        {externalShowImportExportModal && (
          <div style={{ pointerEvents: 'auto' }}>
            <ImportExportModal
              onClose={() => {
                if (typeof externalCloseModal === 'function') {
                  externalCloseModal('importExportModal');
                } else {
                  globalThis.dispatchEvent(
                    new CustomEvent('plubot-close-modal', {
                      detail: { modal: 'importExportModal' },
                    }),
                  );
                }
              }}
              onExport={async () => {
                if (typeof onSave === 'function') {
                  try {
                    await onSave({ isManual: true });
                  } catch {}
                }
                try {
                  const exportData = {
                    nodes: nodes || [],
                    edges: edges || [],
                    metadata: {
                      exportDate: new Date().toISOString(),
                      flowId,
                      plubotName: plubotInfo?.name || 'Mi Chatbot',
                    },
                  };
                  const jsonString = JSON.stringify(exportData, null, 2);
                  const blob = new Blob([jsonString], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `flujo-${plubotInfo?.name || 'plubot'}-${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.append(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch {}
              }}
              onImport={(data) => {
                if (data && data.nodes && data.edges) {
                  try {
                    const newNodes = data.nodes.map((node) => ({
                      ...node,
                      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                    }));
                    const nodeIdMap = {};
                    for (const [index, node] of data.nodes.entries()) {
                      nodeIdMap[node.id] = newNodes[index].id;
                    }
                    const newEdges = data.edges.map((edge) => ({
                      ...edge,
                      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                      source: nodeIdMap[edge.source] || edge.source,
                      target: nodeIdMap[edge.target] || edge.target,
                    }));
                    setNodes(newNodes);
                    setEdges(newEdges);
                    if (typeof externalCloseModal === 'function') {
                      externalCloseModal('importExportModal');
                    } else {
                      globalThis.dispatchEvent(
                        new CustomEvent('plubot-close-modal', {
                          detail: { modal: 'importExportModal' },
                        }),
                      );
                    }
                  } catch {}
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Contenedor de modales con posición fija para evitar empujar contenido */}
      <div
        className='flow-editor-modals'
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      />
    </div>
  );
};

FlowMain.propTypes = {
  project: PropTypes.object,
  onSave: PropTypes.func,
  reactFlowInstance: PropTypes.object,
  setReactFlowInstance: PropTypes.func,
  nodes: PropTypes.array,
  edges: PropTypes.array,
  onNodesChange: PropTypes.func,
  onEdgesChange: PropTypes.func,
  onConnect: PropTypes.func,
  onNodeClick: PropTypes.func,
  onPaneClick: PropTypes.func,
  onEdgeClick: PropTypes.func,
  onNodeDragStop: PropTypes.func,
  onSelectionDragStop: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  onEdgeUpdate: PropTypes.func,
  onEdgeUpdateStart: PropTypes.func,
  onEdgeUpdateEnd: PropTypes.func,
  nodeTypes: PropTypes.object,
  edgeTypes: PropTypes.object,
  validConnectionsHandles: PropTypes.func,
  isUltraMode: PropTypes.bool,
  openModal: PropTypes.func,
  closeModal: PropTypes.func,
  showEmbedModal: PropTypes.bool,
  showTemplateSelector: PropTypes.bool,
  showImportExportModal: PropTypes.bool,
  nodeExtent: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  translateExtent: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  minZoom: PropTypes.number,
};

export default FlowMain;

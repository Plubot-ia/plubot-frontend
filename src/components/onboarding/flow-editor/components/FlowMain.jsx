/**
 * FlowMain.jsx
 * Orquestador visual del editor de flujos
 * Responsable de renderizar nodos y conexiones usando ReactFlow
 *
 * @version 2.0.0
 */

// External Libraries
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactFlow, { Controls, useReactFlow, useViewport } from 'reactflow';
import 'reactflow/dist/style.css';
import useResizeObserver from 'use-resize-observer';
import { v4 as uuidv4 } from 'uuid';

// Internal Aliases (@)
import EmbedModal from '@/components/onboarding/modals/EmbedModal';
import ImportExportModal from '@/components/onboarding/modals/ImportExportModal';
import {
  createNodeTypes,
  edgeTypes as sharedEdgeTypes,
} from '@/flow/nodeRegistry.jsx';
import useFlowStore from '@/stores/use-flow-store';

// Parent Imports (../)
import { calculateCorrectDropPosition } from '../drop-position-fix';
import useAdaptivePerformance from '../hooks/useAdaptivePerformance';
import useContextMenu from '../hooks/useContextMenu';
import useNodeVirtualization from '../hooks/useNodeVirtualization';
import BackgroundScene from '../ui/BackgroundScene';
import CustomMiniMap from '../ui/CustomMiniMap';
import ZoomControls from '../ui/ZoomControls';
import {
  ensureNodesAreInteractive,
  stopNodeInteractionObserver,
} from '../utils/ensure-node-interaction';
import { fixNodePositions } from '../utils/fix-node-positions';
import { MIN_ZOOM, MAX_ZOOM } from '../utils/flow-extents';
import { getLODLevel, LOD_LEVELS } from '../utils/lodUtils';

// Sibling Imports (./) - Components & Logic
import EdgeContextMenu from './menus/EdgeContextMenu';
import NodeContextMenu from './menus/NodeContextMenu';
import MiniMapWrapper from './MiniMapWrapper';
import StorageQuotaManager from './StorageQuotaManager';

// -----------------------------------------
// Helper Functions
// -----------------------------------------

/**
 * Creates a new node object by duplicating an existing one.
 * @param {object} nodeToDuplicate - The node to duplicate.
 * @returns {object} The new duplicated node.
 */
const createDuplicatedNode = (nodeToDuplicate) => ({
  id: uuidv4(),
  type: nodeToDuplicate.type,
  position: {
    x: nodeToDuplicate.position.x + 40,
    y: nodeToDuplicate.position.y + 40,
  },
  data: structuredClone(nodeToDuplicate.data),
});

// CSS Imports
import '../node-positioning.css';
import '../react-flow-overrides.css';
import '../ui/EliteEdge.css';
import '../ui/elite-drag-optimizations.css';
import '../ui/FlowControls.css';
import '../ui/hide-debug-elements.css';
import '../ui/HistoryControls.css';
import '../ui/mega-drag-fix.css';
import '../ui/remove-debug-styles.css';
import '../ui/SyncButton.css';
import '../ui/UltraMode.css';
import '../ui/VerticalButtons.css';
import '../ui/ZoomControls.css';
import './transparent-pane.css';

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

  onEdgesChange: externalOnEdgesChange,
  onConnect: externalOnConnect,
  onNodeClick: externalOnNodeClick,
  onPaneClick: externalOnPaneClick,
  onEdgeClick: externalOnEdgeClick,
  onNodeDragStop: externalOnNodeDragStop,

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
  closeModal: externalCloseModal,
  showEmbedModal: externalShowEmbedModal,
  showImportExportModal: externalShowImportExportModal,
  // Props for canvas behavior - utilizamos valores predeterminados si no se proporcionan
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

  // Referencias para el estado del sistema
  // Nota: Las referencias de rendimiento ahora se manejan en useAdaptivePerformance

  // Estado local para menús contextuales y modales
  const { fitView } = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);
  const [lodLevel, setLodLevel] = useState(LOD_LEVELS.FULL); // Estado para el nivel de detalle

  // Estados para modales internos (solo los que no vienen de props)

  // La virtualización ahora es gestionada por el hook useNodeVirtualization.

  // -----------------------------------------
  // ACCESO AL STORE DE ZUSTAND (SELECTORES)
  // -----------------------------------------
  // Selectores optimizados para minimizar renderizaciones
  const zustandNodes = useFlowStore((state) => state.nodes || []);
  const zustandEdges = useFlowStore((state) => state.edges || []);
  const isUltraMode = useFlowStore((state) => state.isUltraMode);
  const plubotId = useFlowStore((state) => state.plubotId);
  const flowName = useFlowStore((state) => state.flowName);

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
  } = useFlowStore();

  // Determinar si se están usando nodos externos o internos
  const nodes = externalNodes ?? zustandNodes;
  const edges = useMemo(
    () => (areEdgesReady ? externalEdges ?? zustandEdges : []),
    [areEdgesReady, externalEdges, zustandEdges],
  );

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
  // Lógica del menú contextual extraída a un hook personalizado.
  const {
    menu,
    onNodeContextMenu,
    onEdgeContextMenu,
    onPaneClick: handlePaneClickForMenu,
    closeContextMenu,
  } = useContextMenu();
  // Sistema unificado de optimización de rendimiento
  const {
    optimizationLevel,
    startMonitoring,
    updatePerformance,

    fpsRef,
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

  const hysteresisTimer = useRef();

  // Efecto para gestionar el Nivel de Detalle (LOD) con histéresis.
  useEffect(() => {
    // Aquí se podrían pasar umbrales personalizados si se cargaran desde una config.
    const newLodLevel = getLODLevel(viewport.zoom);

    if (newLodLevel !== lodLevel) {
      clearTimeout(hysteresisTimer.current);

      // Si el nuevo nivel es MÁS detallado (número mayor), actualiza inmediatamente.
      setLodLevel(newLodLevel);
    }

    // Capturar el valor de la referencia para usarlo en la función de limpieza.
    // Esto asegura que se limpie el temporizador correcto, evitando condiciones de carrera.
    const timerId = hysteresisTimer.current;
    return () => clearTimeout(timerId);
  }, [viewport.zoom, lodLevel]);

  // INSTRUMENTATION: Log canvas zoom and LOD changes

  // INSTRUMENTATION: Log canvas panning

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
  const handleNodesDelete = useCallback(
    (nodesToDelete) => {
      if (externalOnNodesDelete) {
        externalOnNodesDelete(nodesToDelete);
      }
      closeContextMenu();
    },
    [externalOnNodesDelete, closeContextMenu],
  );

  const handleEdgesDelete = useCallback(
    (edgesToDelete) => {
      if (externalOnEdgesDelete) {
        externalOnEdgesDelete(edgesToDelete);
      }
      closeContextMenu();
    },
    [externalOnEdgesDelete, closeContextMenu],
  );

  const handleDuplicateNode = useCallback(
    (nodeToDuplicate) => {
      const newNode = createDuplicatedNode(nodeToDuplicate);
      useFlowStore.getState().addNode(newNode);
      closeContextMenu();
    },
    [closeContextMenu],
  );

  const handleEditNode = useCallback(
    (_nodeToEdit) => {
      // TODO: Implementar la lógica para abrir el modal de edición de nodos.
      // Por ejemplo: openEditModal(nodeToEdit);
      closeContextMenu();
    },
    [closeContextMenu],
  );

  const handleNodeClick = useCallback(
    (event, node) => {
      if (externalOnNodeClick) {
        externalOnNodeClick(event, node);
      }
      closeContextMenu();
    },
    [externalOnNodeClick, closeContextMenu],
  );

  const handlePaneClick = useCallback(
    (event) => {
      handlePaneClickForMenu(event);
      if (externalOnPaneClick) {
        externalOnPaneClick(event);
      }
    },
    [externalOnPaneClick, handlePaneClickForMenu],
  );

  const handleEdgeClick = useCallback(
    (event, edge) => {
      if (externalOnEdgeClick) {
        externalOnEdgeClick(event, edge);
      }
      closeContextMenu();
    },
    [externalOnEdgeClick, closeContextMenu],
  );

  const onNodeDragStart = useCallback(
    (event, node) => {
      setIsDragging(true);
      setIsNodeBeingDragged(true);
      if (externalOnNodeDragStart) {
        externalOnNodeDragStart(event, node);
      }
    },
    [externalOnNodeDragStart, setIsNodeBeingDragged],
  );

  const onNodeDrag = useCallback(
    (event, node) => {
      if (externalOnNodeDrag) {
        externalOnNodeDrag(event, node);
      }
    },
    [externalOnNodeDrag],
  );

  const onEdgeUpdateStart = useCallback(
    (event, edge) => {
      if (externalOnEdgeUpdateStart) {
        externalOnEdgeUpdateStart(event, edge);
      }
    },
    [externalOnEdgeUpdateStart],
  );

  const onEdgeUpdateEnd = useCallback(
    (event, edge) => {
      if (externalOnEdgeUpdateEnd) {
        externalOnEdgeUpdateEnd(event, edge);
      }
    },
    [externalOnEdgeUpdateEnd],
  );

  const onNodesDelete = useCallback(
    (nodesToDelete) => {
      if (externalOnNodesDelete) externalOnNodesDelete(nodesToDelete);
    },
    [externalOnNodesDelete],
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete) => {
      const localEdges = edgesToDelete;
      if (externalOnEdgesDelete) {
        externalOnEdgesDelete(localEdges);
      }
    },
    [externalOnEdgesDelete],
  );

  const onSelectionChange = useCallback(
    (parameters) => {
      // Lógica unificada para manejar el cambio de selección, evitando procesamiento durante el arrastre.
      const shouldProcess = !isDragging;

      if (externalOnSelectionChange && shouldProcess) {
        externalOnSelectionChange(parameters);
      }
      // La gestión de la selección interna (setSelectedNode) se ha eliminado.
      // React Flow maneja su propia selección visualmente.
      // Si se necesita un estado de nodo seleccionado, debe ser gestionado por el componente padre
      // y pasado a través de props, o reimplementado de una manera que no entre en conflicto.
    },
    [externalOnSelectionChange, isDragging],
  );

  const handleNodeDragStop = useCallback(
    (event, node) => {
      setIsDragging(false);
      setIsNodeBeingDragged(false);
      if (externalOnNodeDragStop) {
        externalOnNodeDragStop(event, node);
      }
    },
    [externalOnNodeDragStop, setIsNodeBeingDragged],
  );

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

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();

      // Si hay un manejador externo, lo llamamos primero
      if (externalOnDrop) {
        externalOnDrop(event);
        return;
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

  const handleEdgeUpdate = useCallback(
    (oldEdge, newConnection) => {
      if (externalOnEdgeUpdate) {
        externalOnEdgeUpdate(oldEdge, newConnection);
      }
    },
    [externalOnEdgeUpdate],
  );

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
        enableLogs: import.meta.env.MODE === 'development' && false, // Deshabilitar logs incluso en desarrollo
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
      const currentViewport = reactFlowInstance.getViewport();
      updatePerformance(currentViewport);
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
        reactFlowInstanceReference.current = undefined;
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
            import.meta.env.MODE === 'development' && (
              <div className='perf-monitor'>
                FPS: {fpsRef.current.toFixed(1)}
                {fpsRef.current < 30 && !isUltraMode && (
                  <span className='perf-warning'> | Activar Ultra</span>
                )}
              </div>
            )}

          {/* Menús contextuales */}
          {menu && menu.type === 'node' && (
            <NodeContextMenu
              nodeId={menu.id}
              position={{ x: menu.left, y: menu.top }}
              onClose={closeContextMenu}
              onDelete={handleNodesDelete}
              onDuplicate={handleDuplicateNode}
              onEdit={handleEditNode}
              nodeData={menu.data}
            />
          )}
          {menu && menu.type === 'edge' && (
            <EdgeContextMenu
              edgeId={menu.id}
              position={{ x: menu.left, y: menu.top }}
              onClose={closeContextMenu}
              onDelete={handleEdgesDelete}
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
                  const jsonString = JSON.stringify(exportData, undefined, 2);
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
                if (!data?.nodes || !data?.edges) return;

                startTransition(() => {
                  try {
                    const newNodes = data.nodes.map((node) => ({
                      ...node,
                      id: uuidv4(),
                    }));
                    const nodeIdMap = new Map(
                      data.nodes.map((node, index) => [
                        node.id,
                        newNodes[index].id,
                      ]),
                    );

                    const newEdges = data.edges
                      .filter(
                        (edge) =>
                          nodeIdMap.has(edge.source) &&
                          nodeIdMap.has(edge.target),
                      )
                      .map((edge) => ({
                        ...edge,
                        id: uuidv4(),
                        source: nodeIdMap.get(edge.source),
                        target: nodeIdMap.get(edge.target),
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
                  } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('Error importing flow:', error);
                  }
                });
              }}
            />
          </div>
        )}
      </div>
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
  onEdgesChange: PropTypes.func,
  onConnect: PropTypes.func,
  onNodeClick: PropTypes.func,
  onPaneClick: PropTypes.func,
  onEdgeClick: PropTypes.func,
  onNodeDragStop: PropTypes.func,
  onNodeDragStart: PropTypes.func,
  onNodesDelete: PropTypes.func,
  onEdgesDelete: PropTypes.func,
  onSelectionChange: PropTypes.func,
  onNodeDrag: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  onEdgeUpdate: PropTypes.func,
  onEdgeUpdateStart: PropTypes.func,
  onEdgeUpdateEnd: PropTypes.func,
  nodeTypes: PropTypes.object,
  edgeTypes: PropTypes.object,
  validConnectionsHandles: PropTypes.func,
  closeModal: PropTypes.func,
  showEmbedModal: PropTypes.bool,
  showImportExportModal: PropTypes.bool,
  minZoom: PropTypes.number,
};

export default FlowMain;

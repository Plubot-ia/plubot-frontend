// OPTIMIZACIÓN DEFINITIVA para el arrastre de nodos y aristas
// Implementación elite con máximo rendimiento y fluidez
import { useCallback, useRef, useEffect } from 'react';

import useFlowStore from '@/stores/use-flow-store';

import {
  buildConnectionsCache,
  validateAndNormalizeNode,
  calculateNodeCenter,
  processSourceConnections,
  processTargetConnections,
  applyEdgeUpdates,
  handleDragStart as utilityHandleDragStart,
  handleDragEnd as utilityHandleDragEnd,
} from '../utils/edge-drag-utilities.js';

/**
 * Hook de optimización avanzada para el arrastre de nodos
 * Implementa un sistema de alto rendimiento con tres niveles de optimización:
 * 1. Cache de conexiones para minimizar búsquedas
 * 2. Actualización diferida para maximizar fluidez
 * 3. Gestión de memoria para evitar fugas
 *
 * @returns {Object} Manejadores optimizados para eventos de arrastre
 */
// Configuración de rendimiento ajustable
const PERFORMANCE_CONFIG = {
  // Umbral de tiempo mínimo entre actualizaciones en milisegundos
  UPDATE_INTERVAL_MS: 50,
  // Límite de conexiones para optimización agresiva
  MAX_CONNECTIONS_FOR_REALTIME: 4,
  // Indica si el movimiento debe ser absolutamente fluido
  PRIORITIZE_FLUIDITY: true,
};

/**
 * Creates drag state management functions
 */
const createDragStateManager = (dragState, nodeConnectionsCache) => {
  const handleDragStart = (node) => {
    return utilityHandleDragStart(node, dragState, nodeConnectionsCache);
  };

  const handleDragEnd = (node) => {
    return utilityHandleDragEnd(node, dragState);
  };

  return { handleDragStart, handleDragEnd };
};

/**
 * Creates drag progress handler with performance optimization
 */
const createDragProgressHandler = ({ dragState, nodeConnectionsCache, updateEdgesOnDrag }) => {
  return (node) => {
    const now = performance.now();
    const nodeId = node.id;
    dragState.current.isDragging = true;
    dragState.current.lastNode = node;

    // Verificar si el nodo tiene conexiones
    const connectionInfo = nodeConnectionsCache.current.get(nodeId);
    if (
      !connectionInfo ||
      (connectionInfo.sourcesOf.length === 0 && connectionInfo.targetsOf.length === 0)
    ) {
      return; // Nodo sin conexiones, no necesita actualizar aristas
    }

    const totalConnections = connectionInfo.sourcesOf.length + connectionInfo.targetsOf.length;

    // Estrategia 1: Pocos nodos - Actualización en tiempo real
    if (totalConnections <= PERFORMANCE_CONFIG.MAX_CONNECTIONS_FOR_REALTIME) {
      if (now - dragState.current.lastUpdateTime > 25) {
        updateEdgesOnDrag(node);
        dragState.current.lastUpdateTime = now;
      }
      return;
    }

    // Estrategia 2: Muchos nodos - Actualización diferida
    if (
      !dragState.current.pendingUpdate &&
      now - dragState.current.lastUpdateTime > PERFORMANCE_CONFIG.UPDATE_INTERVAL_MS
    ) {
      dragState.current.pendingUpdate = true;
      requestAnimationFrame(() => {
        if (dragState.current.isDragging && dragState.current.lastNode) {
          updateEdgesOnDrag(dragState.current.lastNode);
        }
        dragState.current.lastUpdateTime = performance.now();
        dragState.current.pendingUpdate = false;
      });
    }
  };
};

/**
 * Creates updateEdgesOnDrag function with all dependencies
 */
const createUpdateEdgesOnDragFunction = ({
  validateAndNormalizeNodeWrapped,
  buildConnectionsCacheWrapped,
  connectionCacheNeedsUpdate,
  nodeConnectionsCache,
  calculateNodeCenterWrapped,
  processSourceConnectionsWrapped,
  processTargetConnectionsWrapped,
  applyEdgeUpdatesWrapped,
}) => {
  return (node) => {
    const draggedNode = validateAndNormalizeNodeWrapped(node);
    if (!draggedNode) return;

    // Reconstruir caché si es necesario
    if (connectionCacheNeedsUpdate.current) {
      buildConnectionsCacheWrapped();
    }

    // Verificar conexiones del nodo
    const connections = nodeConnectionsCache.current.get(draggedNode.id);
    if (
      !connections ||
      (connections.sourcesOf.length === 0 && connections.targetsOf.length === 0)
    ) {
      return;
    }

    // Calcular centro y procesar actualizaciones
    const nodeCenter = calculateNodeCenterWrapped(draggedNode);
    const edgeUpdates = [
      ...processSourceConnectionsWrapped(connections.sourcesOf, nodeCenter),
      ...processTargetConnectionsWrapped(connections.targetsOf, nodeCenter),
    ];

    // Aplicar actualizaciones
    applyEdgeUpdatesWrapped(edgeUpdates);
  };
};

/**
 * Creates cleanup effect for component unmount
 */
const createCleanupEffect = () => {
  return () => {
    document.body.classList.remove('elite-node-dragging', 'elite-ultra-dragging');
  };
};

/**
 * Creates ultra drag handler for maximum performance
 */
const createUltraDragHandler = (updateEdgesOnDrag, dragState) => {
  return (event, node) => {
    if (!node) return;

    const eventType = event.type ?? '';

    // En eventos de inicio y fin, siempre aplicar actualizaciones
    if (eventType === 'dragstart') {
      // Solo marcar el inicio del arrastre
      dragState.current.isDragging = true;
      dragState.current.lastNode = node;
      document.body.classList.add('elite-node-dragging', 'elite-ultra-dragging');
    } else if (eventType === 'dragend') {
      // Garantizar actualización al final del arrastre
      updateEdgesOnDrag(node);
      document.body.classList.remove('elite-node-dragging', 'elite-ultra-dragging');
      dragState.current.isDragging = false;
    }
    // Durante el arrastre NO actualizar nada para máxima fluidez
  };
};

const useEdgeDragOptimizer = () => {
  // Usar el store de Zustand directamente
  const { edges, nodes, setEdges } = useFlowStore((state) => ({
    edges: state.edges,
    nodes: state.nodes,
    setEdges: state.setEdges,
  }));

  // Sistema avanzado de caché de conexiones para minimizar búsquedas
  const nodeConnectionsCache = useRef(new Map());

  // Verifica si la caché necesita actualización
  const connectionCacheNeedsUpdate = useRef(true);

  // Referencias a datos del último estado
  const lastEdgeCount = useRef(0);

  // Construir la caché de conexiones sólo cuando es necesario (extraído a utilidades)
  const buildConnectionsCacheWrapped = useCallback(() => {
    buildConnectionsCache(edges, {
      nodeConnectionsCache,
      connectionCacheNeedsUpdate,
      lastEdgeCount,
    });
  }, [edges]);

  // Validación y normalización de nodos (extraído a utilidades)
  const validateAndNormalizeNodeWrapped = useCallback(
    (node) => validateAndNormalizeNode(node, nodes),
    [nodes],
  );

  // Cálculo del centro del nodo (extraído a utilidades)
  const calculateNodeCenterWrapped = useCallback((node) => calculateNodeCenter(node), []);

  // Procesamiento de conexiones de origen (extraído a utilidades)
  const processSourceConnectionsWrapped = useCallback(
    (sourcesOf, nodeCenter) => processSourceConnections(sourcesOf, nodeCenter, edges),
    [edges],
  );

  // Procesamiento de conexiones de destino (extraído a utilidades)
  const processTargetConnectionsWrapped = useCallback(
    (targetsOf, nodeCenter) => processTargetConnections(targetsOf, nodeCenter, edges),
    [edges],
  );

  // Aplicación de actualizaciones de aristas (extraído a utilidades)
  const applyEdgeUpdatesWrapped = useCallback(
    (edgeUpdates) => applyEdgeUpdates(edgeUpdates, edges, setEdges),
    [edges, setEdges],
  );

  // RENDIMIENTO MÁXIMO: Sistema de actualización de aristas ultra-optimizado
  const updateEdgesOnDrag = useCallback(
    (node) => {
      return createUpdateEdgesOnDragFunction({
        validateAndNormalizeNodeWrapped,
        buildConnectionsCacheWrapped,
        connectionCacheNeedsUpdate,
        nodeConnectionsCache,
        calculateNodeCenterWrapped,
        processSourceConnectionsWrapped,
        processTargetConnectionsWrapped,
        applyEdgeUpdatesWrapped,
      })(node);
    },
    [
      buildConnectionsCacheWrapped,
      validateAndNormalizeNodeWrapped,
      calculateNodeCenterWrapped,
      processSourceConnectionsWrapped,
      processTargetConnectionsWrapped,
      applyEdgeUpdatesWrapped,
    ],
  );

  // Actualizar caché cuando cambia la estructura de aristas
  useEffect(() => {
    connectionCacheNeedsUpdate.current = true;
    buildConnectionsCacheWrapped();
  }, [edges.length, buildConnectionsCacheWrapped]);

  // Almacenamiento persistente para gestionar estado durante el arrastre
  const dragState = useRef({
    isDragging: false,
    lastUpdateTime: 0,
    lastNode: undefined,
    pendingUpdate: false,
    dragStartPosition: undefined,
    dragCurrentPosition: undefined,
  });

  // Create drag handlers using extracted helper functions
  const { handleDragStart: _handleDragStart, handleDragEnd: _handleDragEnd } =
    createDragStateManager(dragState, nodeConnectionsCache);

  const _handleDragProgress = useCallback(
    (node) => {
      return createDragProgressHandler({
        dragState,
        nodeConnectionsCache,
        updateEdgesOnDrag,
      })(node);
    },
    [updateEdgesOnDrag],
  );

  // TRIPLE OPTIMIZACIÓN: Sistema de tres capas para máxima fluidez
  // 1. Detecta el evento sin throttling para sentirse instantáneo
  // 2. Procesa el movimiento visualmente sin esperas
  // 3. Actualiza las conexiones de forma diferida y optimizada
  const handleNodeDrag = useCallback(
    (event, node) => {
      if (!node) return;

      // Capturar el tipo de evento para procesamiento diferenciado
      const eventType = event.type || 'drag';

      // FASE 1: INICIO DEL ARRASTRE
      if (eventType === 'dragstart') {
        _handleDragStart(node);
        return;
      }

      // FASE 2: FIN DEL ARRASTRE
      if (eventType === 'dragend') {
        _handleDragEnd(node);
        return;
      }

      // FASE 3: DURANTE EL ARRASTRE
      _handleDragProgress(node);
    },
    [_handleDragStart, _handleDragEnd, _handleDragProgress],
  );

  // MODO ULTRA: Máxima fluidez sacrificando actualización visual en tiempo real
  const handleNodeDragUltra = useCallback(
    (event, node) => {
      return createUltraDragHandler(updateEdgesOnDrag, dragState)(event, node);
    },
    [updateEdgesOnDrag],
  );

  // Limpieza de clases y estado en desmontaje
  useEffect(createCleanupEffect, []);

  // Función de invalidación de caché para uso externo
  const invalidateConnectionCache = useCallback(() => {
    connectionCacheNeedsUpdate.current = true;
  }, []);

  // Interfaz pública del hook
  return {
    handleNodeDrag, // Manejador estándar optimizado
    handleNodeDragUltra, // Manejador ultra-rendimiento
    updateEdgesOnDrag, // Actualizador directo de aristas
    buildConnectionsCache, // Constructor de caché
    invalidateConnectionCache, // Invalidador de caché para eventos externos
  };
};

export default useEdgeDragOptimizer;

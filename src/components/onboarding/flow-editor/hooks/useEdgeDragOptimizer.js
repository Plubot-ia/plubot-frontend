// OPTIMIZACIÓN DEFINITIVA para el arrastre de nodos y aristas
// Implementación elite con máximo rendimiento y fluidez
import { throttle, debounce } from 'lodash';
import { useCallback, useMemo, useRef, useEffect } from 'react';

import useFlowStore from '@/stores/useFlowStore';

/**
 * Hook de optimización avanzada para el arrastre de nodos
 * Implementa un sistema de alto rendimiento con tres niveles de optimización:
 * 1. Cache de conexiones para minimizar búsquedas
 * 2. Actualización diferida para maximizar fluidez
 * 3. Gestión de memoria para evitar fugas
 *
 * @returns {Object} Manejadores optimizados para eventos de arrastre
 */
const useEdgeDragOptimizer = () => {
  // Usar el store de Zustand directamente
  const edges = useFlowStore(state => state.edges);
  const nodes = useFlowStore(state => state.nodes);
  const setEdges = useFlowStore(state => state.setEdges);
  // Sistema avanzado de caché de conexiones para minimizar búsquedas
  const nodeConnectionsCache = useRef(new Map());

  // Verifica si la caché necesita actualización
  const connectionCacheNeedsUpdate = useRef(true);

  // Referencias a datos del último estado
  const lastEdgeCount = useRef(0);

  // Construir la caché de conexiones sólo cuando es necesario
  const buildConnectionsCache = useCallback(() => {
    // Evitar reconstrucciones innecesarias
    if (!connectionCacheNeedsUpdate.current && lastEdgeCount.current === edges.length) {
      return;
    }

    // Actualizar los contadores de estado
    lastEdgeCount.current = edges.length;
    connectionCacheNeedsUpdate.current = false;

    // OPTIMIZACIÓN: Construir caché completa de conexiones de aristas para nodos
    const newCache = new Map();

    if (edges.length > 0) {
      edges.forEach(edge => {
        if (!edge.source || !edge.target) return;

        // Registrar aristas salientes para el nodo origen
        if (!newCache.has(edge.source)) {
          newCache.set(edge.source, { sourcesOf: [], targetsOf: [] });
        }
        newCache.get(edge.source).sourcesOf.push(edge.id);

        // Registrar aristas entrantes para el nodo destino
        if (!newCache.has(edge.target)) {
          newCache.set(edge.target, { sourcesOf: [], targetsOf: [] });
        }
        newCache.get(edge.target).targetsOf.push(edge.id);
      });
    }

    // Actualizar la caché global
    nodeConnectionsCache.current = newCache;
  }, [edges]);

  // RENDIMIENTO MÁXIMO: Sistema de actualización de aristas ultra-optimizado
  const updateEdgesOnDrag = useCallback((node) => {
    if (!node) return;

    // Verificar validez del nodo
    const draggedNode = typeof node === 'string' ?
      nodes.find(n => n.id === node) : node;

    if (!draggedNode || !draggedNode.id || !draggedNode.position) return;

    // Reconstruir caché si es necesario
    if (connectionCacheNeedsUpdate.current) {
      buildConnectionsCache();
    }

    // OPTIMIZACIÓN 1: Verificar si el nodo tiene alguna conexión
    const nodeId = draggedNode.id;
    const connections = nodeConnectionsCache.current.get(nodeId);

    if (!connections || (connections.sourcesOf.length === 0 && connections.targetsOf.length === 0)) {
      return;
    }

    // OPTIMIZACIÓN 2: Crear un array de cambios específicos
    // en lugar de modificar todo el array de aristas
    const edgeUpdates = [];
    const nodeCenter = {
      x: draggedNode.position.x + (draggedNode.width || 100) / 2,
      y: draggedNode.position.y + (draggedNode.height || 40) / 2,
    };

    // MEJORA CRÍTICA: Batch de actualizaciones en un único array
    // para evitar múltiples re-renderizados

    // Actualizar aristas donde este nodo es origen
    if (connections.sourcesOf.length > 0) {
      connections.sourcesOf.forEach(edgeId => {
        const edgeIndex = edges.findIndex(e => e.id === edgeId);
        if (edgeIndex !== -1) {
          edgeUpdates.push({
            id: edgeId,
            sourceX: nodeCenter.x,
            sourceY: nodeCenter.y,
          });
        }
      });
    }

    // Actualizar aristas donde este nodo es destino
    if (connections.targetsOf.length > 0) {
      connections.targetsOf.forEach(edgeId => {
        const edgeIndex = edges.findIndex(e => e.id === edgeId);
        if (edgeIndex !== -1) {
          edgeUpdates.push({
            id: edgeId,
            targetX: nodeCenter.x,
            targetY: nodeCenter.y,
          });
        }
      });
    }

    // OPTIMIZACIÓN 3: Aplicar TODAS las actualizaciones en un solo cambio atómico
    // Solo si hay cambios que aplicar
    if (edgeUpdates.length > 0) {
      // Aplicar todos los cambios de una vez para minimizar renderizados
      const updatedEdges = edges.map(edge => {
        const update = edgeUpdates.find(u => u.id === edge.id);
        if (!update) return edge;

        return {
          ...edge,
          ...(update.sourceX !== undefined ? { sourceX: update.sourceX } : {}),
          ...(update.sourceY !== undefined ? { sourceY: update.sourceY } : {}),
          ...(update.targetX !== undefined ? { targetX: update.targetX } : {}),
          ...(update.targetY !== undefined ? { targetY: update.targetY } : {}),
        };
      });

      // ACTUALIZACIÓN ATÓMICA: un solo setEdges para todos los cambios
      setEdges(updatedEdges);
    }
  }, [edges, nodes, setEdges, buildConnectionsCache]);

  // Actualizar caché cuando cambia la estructura de aristas
  useEffect(() => {
    connectionCacheNeedsUpdate.current = true;
    buildConnectionsCache();
  }, [edges.length, buildConnectionsCache]);

  // Almacenamiento persistente para gestionar estado durante el arrastre
  const dragState = useRef({
    isDragging: false,
    lastUpdateTime: 0,
    lastNode: null,
    pendingUpdate: false,
    dragStartPosition: null,
    dragCurrentPosition: null,
  });

  // Configuración de rendimiento ajustable
  const PERFORMANCE_CONFIG = {
    // Umbral de tiempo mínimo entre actualizaciones en milisegundos
    UPDATE_INTERVAL_MS: 50,
    // Límite de conexiones para optimización agresiva
    MAX_CONNECTIONS_FOR_REALTIME: 4,
    // Indica si el movimiento debe ser absolutamente fluido
    PRIORITIZE_FLUIDITY: true,
  };

  // TRIPLE OPTIMIZACIÓN: Sistema de tres capas para máxima fluidez
  // 1. Detecta el evento sin throttling para sentirse instantáneo
  // 2. Procesa el movimiento visualmente sin esperas
  // 3. Actualiza las conexiones de forma diferida y optimizada
  const handleNodeDrag = useCallback((event, node) => {
    if (!node) return;

    // Capturar el tipo de evento para procesamiento diferenciado
    const eventType = event.type || 'drag';
    const nodeId = node.id;
    const now = performance.now();

    // FASE 1: INICIO DEL ARRASTRE
    if (eventType === 'dragstart') {
      dragState.current = {
        ...dragState.current,
        isDragging: true,
        lastUpdateTime: now,
        lastNode: node,
        dragStartPosition: { ...node.position },
        dragCurrentPosition: { ...node.position },
      };

      // OPTIMIZACIÓN: Marcar el cuerpo con clase para optimizaciones CSS
      document.body.classList.add('elite-node-dragging');
      return;
    }

    // FASE 2: FIN DEL ARRASTRE
    if (eventType === 'dragend') {
      // Actualización final garantizada
      updateEdgesOnDrag(node);

      document.body.classList.remove('elite-node-dragging');

      dragState.current = {
        ...dragState.current,
        isDragging: false,
        pendingUpdate: false,
        lastNode: null,
      };
      return;
    }

    // FASE 3: DURANTE EL ARRASTRE (la parte crítica para el rendimiento)
    // Actualizar la posición actual para referencia
    dragState.current.dragCurrentPosition = { ...node.position };
    dragState.current.lastNode = node;

    // OPTIMIZACIÓN CRÍTICA: Verificar primero si el nodo tiene conexiones
    const connectionInfo = nodeConnectionsCache.current.get(nodeId);
    if (!connectionInfo ||
        (connectionInfo.sourcesOf.length === 0 &&
         connectionInfo.targetsOf.length === 0)) {
      // SALIDA ULTRA-RÁPIDA: Nodo sin conexiones, no necesita actualizar aristas
      return;
    }

    // Estrategia adaptativa basada en cantidad de conexiones
    const totalConnections = connectionInfo.sourcesOf.length + connectionInfo.targetsOf.length;

    // ESTRATEGIA 1: Pocos nodos - Actualización en tiempo real
    if (totalConnections <= PERFORMANCE_CONFIG.MAX_CONNECTIONS_FOR_REALTIME) {
      // Frecuencia controlada pero alta para máxima precisión visual
      if (now - dragState.current.lastUpdateTime > 25) {
        updateEdgesOnDrag(node);
        dragState.current.lastUpdateTime = now;
      }
      return;
    }

    // ESTRATEGIA 2: Muchos nodos - Actualización diferida
    // Solo actualizar si ha pasado suficiente tiempo Y no hay una actualización pendiente
    if (!dragState.current.pendingUpdate &&
        now - dragState.current.lastUpdateTime > PERFORMANCE_CONFIG.UPDATE_INTERVAL_MS) {

      dragState.current.pendingUpdate = true;

      // Usar requestAnimationFrame para sincronizar con el ciclo de renderizado
      requestAnimationFrame(() => {
        // Verificar si todavía estamos arrastrando
        if (dragState.current.isDragging && dragState.current.lastNode) {
          updateEdgesOnDrag(dragState.current.lastNode);
        }
        dragState.current.lastUpdateTime = performance.now();
        dragState.current.pendingUpdate = false;
      });
    }
  }, [updateEdgesOnDrag]);

  // MODO ULTRA: Máxima fluidez sacrificando actualización visual en tiempo real
  const handleNodeDragUltra = useCallback((event, node) => {
    if (!node) return;

    const eventType = event.type || '';

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
  }, [updateEdgesOnDrag]);

  // Limpieza de clases y estado en desmontaje
  useEffect(() => {
    return () => {
      document.body.classList.remove('elite-node-dragging', 'elite-ultra-dragging');
    };
  }, []);

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

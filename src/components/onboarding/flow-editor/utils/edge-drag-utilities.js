/**
 * @file edge-drag-utilities.js
 * @description Utilidades para optimización de arrastre de aristas
 * Extraído de useEdgeDragOptimizer.js para reducir max-lines-per-function
 */

/**
 * Construir la caché de conexiones sólo cuando es necesario
 * @param {Array} edges - Lista de aristas
 * @param {Object} refs - Referencias a caché y contadores
 * @returns {Map} Caché de conexiones actualizada
 */
export function buildConnectionsCache(edges, references) {
  const { nodeConnectionsCache, connectionCacheNeedsUpdate, lastEdgeCount } =
    references;

  // Evitar reconstrucciones innecesarias
  if (
    !connectionCacheNeedsUpdate.current &&
    lastEdgeCount.current === edges.length
  ) {
    return nodeConnectionsCache.current;
  }

  // Actualizar los contadores de estado
  lastEdgeCount.current = edges.length;
  connectionCacheNeedsUpdate.current = false;

  // OPTIMIZACIÓN: Construir caché completa de conexiones de aristas para nodos
  const newCache = new Map();

  if (edges.length > 0) {
    for (const edge of edges) {
      if (!edge.source || !edge.target) continue;

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
    }
  }

  // Actualizar la caché global
  nodeConnectionsCache.current = newCache;
  return newCache;
}

/**
 * Valida y normaliza el nodo arrastrado
 * @param {*} node - Nodo a validar
 * @param {Array} nodes - Lista de nodos disponibles
 * @returns {Object|null} Nodo validado o null si inválido
 */
export function validateAndNormalizeNode(node, nodes) {
  if (!node) return;

  const draggedNode =
    typeof node === 'string'
      ? nodes.find((nodeItem) => nodeItem.id === node)
      : node;

  return draggedNode && draggedNode.id && draggedNode.position
    ? draggedNode
    : undefined;
}

/**
 * Calcula el centro del nodo
 * @param {Object} node - Nodo del cual calcular el centro
 * @returns {Object} Coordenadas del centro {x, y}
 */
export function calculateNodeCenter(node) {
  return {
    x: node.position.x + (node.width || 100) / 2,
    y: node.position.y + (node.height || 40) / 2,
  };
}

/**
 * Procesa las conexiones de origen de un nodo
 * @param {Array} sourcesOf - IDs de aristas donde el nodo es origen
 * @param {Object} nodeCenter - Centro del nodo
 * @param {Array} edges - Lista de aristas
 * @returns {Array} Actualizaciones de aristas
 */
export function processSourceConnections(sourcesOf, nodeCenter, edges) {
  const updates = [];
  for (const edgeId of sourcesOf) {
    const edgeIndex = edges.findIndex((edge) => edge.id === edgeId);
    if (edgeIndex !== -1) {
      updates.push({
        id: edgeId,
        sourceX: nodeCenter.x,
        sourceY: nodeCenter.y,
      });
    }
  }
  return updates;
}

/**
 * Procesa las conexiones de destino de un nodo
 * @param {Array} targetsOf - IDs de aristas donde el nodo es destino
 * @param {Object} nodeCenter - Centro del nodo
 * @param {Array} edges - Lista de aristas
 * @returns {Array} Actualizaciones de aristas
 */
export function processTargetConnections(targetsOf, nodeCenter, edges) {
  const updates = [];
  for (const edgeId of targetsOf) {
    const edgeIndex = edges.findIndex((edge) => edge.id === edgeId);
    if (edgeIndex !== -1) {
      updates.push({
        id: edgeId,
        targetX: nodeCenter.x,
        targetY: nodeCenter.y,
      });
    }
  }
  return updates;
}

/**
 * Aplica actualizaciones a las aristas
 * @param {Array} edgeUpdates - Array de actualizaciones
 * @param {Array} edges - Lista de aristas actual
 * @param {Function} setEdges - Función para actualizar aristas
 */
export function applyEdgeUpdates(edgeUpdates, edges, setEdges) {
  if (edgeUpdates.length === 0) return;

  const updatedEdges = edges.map((edge) => {
    const update = edgeUpdates.find((u) => u.id === edge.id);
    if (!update) return edge;

    return {
      ...edge,
      ...(update.sourceX !== undefined && { sourceX: update.sourceX }),
      ...(update.sourceY !== undefined && { sourceY: update.sourceY }),
      ...(update.targetX !== undefined && { targetX: update.targetX }),
      ...(update.targetY !== undefined && { targetY: update.targetY }),
    };
  });

  setEdges(updatedEdges);
}

/**
 * Maneja el inicio del arrastre de nodos
 * @param {Object} node - Nodo que se está arrastrando
 * @param {Object} dragState - Referencia al estado de arrastre
 */
export function handleDragStart(node, dragState) {
  const now = performance.now();
  dragState.current = {
    ...dragState.current,
    isDragging: true,
    lastUpdateTime: now,
    lastNode: node,
    dragStartPosition: { ...node.position },
    dragCurrentPosition: { ...node.position },
  };
  document.body.classList.add('elite-node-dragging');
}

/**
 * Maneja el final del arrastre de nodos
 * @param {Object} node - Nodo que se terminó de arrastrar
 * @param {Object} dragState - Referencia al estado de arrastre
 * @param {Function} updateEdgesOnDrag - Función para actualizar aristas
 */
export function handleDragEnd(node, dragState, updateEdgesOnDrag) {
  updateEdgesOnDrag(node);
  document.body.classList.remove('elite-node-dragging');
  dragState.current = {
    ...dragState.current,
    isDragging: false,
    pendingUpdate: false,
    lastNode: undefined,
  };
}

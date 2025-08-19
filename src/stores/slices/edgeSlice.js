import { applyEdgeChanges, addEdge } from 'reactflow';

import { createSanitizedObject } from '../../utils/object-sanitizer';

// Aunque no se use para iterar, se mantiene como referencia de las propiedades permitidas.

/**
 * Sanitiza una arista eliminando handles inválidos y forzando tipos apropiados
 * @param {Object} edge - Arista a sanitizar
 * @param {Map} nodeTypes - Mapa de tipos de nodos por ID
 * @returns {Object} Arista sanitizada
 */
/**
 * Verifica si un handle es inválido
 * @param {*} handle - Handle a verificar
 * @returns {boolean} True si el handle es inválido
 */
function _isInvalidHandle(handle) {
  // Solo considerar inválidos: null, undefined, 'null', y strings completamente vacíos
  // NO eliminar handles válidos como 'output', 'input', 'source', 'target', etc.
  return handle === null || handle === undefined || handle === 'null' || handle === '';
}

/**
 * Verifica si un nodo requiere arista eliteEdge
 * @param {string} nodeType - Tipo del nodo
 * @returns {boolean} True si requiere eliteEdge
 */
function _requiresEliteEdge(nodeType) {
  return nodeType === 'decision' || nodeType === 'option';
}

function _sanitizeEdge(edge, nodeTypes) {
  const newEdge = { ...edge };

  // REGLA 1: Eliminar handles inválidos
  if (_isInvalidHandle(newEdge.sourceHandle)) delete newEdge.sourceHandle;
  if (_isInvalidHandle(newEdge.targetHandle)) delete newEdge.targetHandle;

  // REGLA 2: Forzar tipo para nodos complejos
  const sourceType = nodeTypes.get(edge.source);
  const targetType = nodeTypes.get(edge.target);
  if (_requiresEliteEdge(sourceType) || _requiresEliteEdge(targetType)) {
    newEdge.type = 'eliteEdge';
  }

  // Si no tiene tipo, usar 'default'
  if (!newEdge.type) newEdge.type = 'default';

  return newEdge;
}
const ALLOWED_EDGE_DATA_PROPERTIES = [
  'animated',
  'style',
  'label',
  'sourceX',
  'sourceY',
  'targetX',
  'targetY',
  'labelStyle',
  'labelBgStyle',
  'markerEnd',
  'markerStart',
];

export const createEdgeSlice = (set, get) => ({
  edges: [],
  edgeCount: 0, // Contador dedicado para evitar re-renders innecesarios
  onEdgesChange: (changes) => {
    set((state) => {
      const newEdges = applyEdgeChanges(changes, state.edges);

      // OPTIMIZACIÓN CRÍTICA: Solo calcular y actualizar contador en cambios que afecten cantidad
      const hasRemovalOrAddition = changes.some(
        (c) => c.type === 'remove' || c.type === 'add' || (c.type === 'reset' && c.item),
      );

      const updateObject = {
        edges: newEdges,
        hasChanges: true,
      };

      // Solo actualizar el contador si hay cambios que afecten la cantidad
      if (hasRemovalOrAddition) {
        const shouldUpdateCount = newEdges.length !== state.edgeCount;

        if (shouldUpdateCount) {
          updateObject.edgeCount = newEdges.length;
        }
      }

      return updateObject;
    });
  },
  // Función auxiliar para deduplicar edges
  _deduplicateEdges: (edges) => {
    const edgeMap = new Map();
    for (const edge of edges) {
      if (edge?.id) edgeMap.set(edge.id, edge);
    }
    return [...edgeMap.values()];
  },

  // Función auxiliar para procesar y sanitizar edges
  _processEdges: (newEdges, nodes) => {
    const nodeTypes = new Map(nodes.map((n) => [n.id, n.type]));
    return newEdges.map((edge) => _sanitizeEdge(edge, nodeTypes));
  },

  setEdges: (newEdges) => {
    const {
      edges: currentEdges,
      nodes,
      _createHistoryEntry,
      _deduplicateEdges,
      _processEdges,
    } = get();

    if (!newEdges || !Array.isArray(newEdges)) return;

    // Deduplicar y sanitizar
    const deduplicatedEdges = _deduplicateEdges(newEdges);
    const sanitizedEdges = _processEdges(deduplicatedEdges, nodes);

    if (JSON.stringify(currentEdges) === JSON.stringify(sanitizedEdges)) return;

    set({ edges: sanitizedEdges, edgeCount: sanitizedEdges.length });
    _createHistoryEntry({ edges: sanitizedEdges });
  },
  onConnect: (connection) => {
    const { edges, nodes, _createHistoryEntry } = get();

    // Validar conexión
    if (!connection?.source || !connection?.target) return;
    if (connection.sourceHandle === undefined || connection.targetHandle === undefined) return;

    // Verificar nodos
    const sourceExists = nodes.some((n) => n.id === connection.source);
    const targetExists = nodes.some((n) => n.id === connection.target);
    if (!sourceExists || !targetExists) return;

    try {
      const newEdges = addEdge(connection, edges);
      set({ edges: newEdges, edgeCount: newEdges.length });
      _createHistoryEntry({ edges: newEdges });
    } catch {
      // Error handled silently
    }
  },
  updateEdge: (id, data) => {
    const { edges, _createHistoryEntry } = get();
    const newEdges = edges.map((edge) => {
      if (edge.id === id) {
        const sanitizedData = createSanitizedObject(data, ALLOWED_EDGE_DATA_PROPERTIES);
        const updatedData = { ...edge.data, ...sanitizedData };
        return { ...edge, data: updatedData };
      }
      return edge;
    });

    // Actualizar las aristas en el estado
    set({ edges: newEdges });

    _createHistoryEntry({ edges: newEdges });
  },
  removeEdge: (edgeId) => {
    const { edges, _createHistoryEntry } = get();
    const newEdges = edges.filter((edge) => edge.id !== edgeId);

    // Actualizar tanto las aristas como el contador
    set({
      edges: newEdges,
      edgeCount: newEdges.length,
    });

    _createHistoryEntry({ edges: newEdges });
  },
  cleanUpEdges: () => {
    const { nodes, edges, _createHistoryEntry } = get();
    const nodeIds = new Set(nodes.map((n) => n.id));

    const validEdges = edges.filter((edge) => {
      const hasValidNodes = nodeIds.has(edge.source) && nodeIds.has(edge.target);
      const hasValidHandles = edge.sourceHandle !== undefined && edge.targetHandle !== undefined;
      return hasValidNodes && hasValidHandles;
    });

    if (validEdges.length !== edges.length) {
      set({ edges: validEdges, edgeCount: validEdges.length });
      _createHistoryEntry({ edges: validEdges });
    }
  },

  cleanUpInvalidHandleEdges: () => {
    const { edges, _createHistoryEntry } = get();
    const validEdges = edges.filter(
      (edge) => edge.sourceHandle !== undefined && edge.targetHandle !== undefined,
    );

    if (validEdges.length !== edges.length) {
      set({ edges: validEdges, edgeCount: validEdges.length });
      _createHistoryEntry({ edges: validEdges });
    }
  },
});

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
  return handle === null || handle === undefined || handle === 'null';
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

  // REGLA 1: Eliminar handles inválidos en todas sus formas.
  if (_isInvalidHandle(newEdge.sourceHandle)) {
    delete newEdge.sourceHandle;
  }
  if (_isInvalidHandle(newEdge.targetHandle)) {
    delete newEdge.targetHandle;
  }

  // REGLA 2: Forzar el tipo de arista a 'eliteEdge' para nodos complejos.
  const sourceType = nodeTypes.get(edge.source);
  const targetType = nodeTypes.get(edge.target);
  if (_requiresEliteEdge(sourceType) || _requiresEliteEdge(targetType)) {
    newEdge.type = 'eliteEdge';
  }

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
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      hasChanges: true,
    }));
  },
  setEdges: (newEdges) => {
    const { edges: currentEdges, nodes, _createHistoryEntry } = get();

    // Sanear las aristas antes de hacer cualquier otra cosa.
    const nodeTypes = new Map(nodes.map((node) => [node.id, node.type]));
    const sanitizedEdges = newEdges.map((edge) =>
      _sanitizeEdge(edge, nodeTypes),
    );

    if (JSON.stringify(currentEdges) === JSON.stringify(sanitizedEdges)) return;

    _createHistoryEntry({ edges: sanitizedEdges });
  },
  onConnect: (connection) => {
    const { edges, _createHistoryEntry } = get();
    const newEdges = addEdge(connection, edges);
    _createHistoryEntry({ edges: newEdges });
  },
  updateEdge: (id, data) => {
    const { edges, _createHistoryEntry } = get();
    const newEdges = edges.map((edge) => {
      if (edge.id === id) {
        const sanitizedData = createSanitizedObject(
          data,
          ALLOWED_EDGE_DATA_PROPERTIES,
        );
        const updatedData = { ...edge.data, ...sanitizedData };
        return { ...edge, data: updatedData };
      }
      return edge;
    });
    _createHistoryEntry({ edges: newEdges });
  },
  removeEdge: (edgeId) => {
    const { edges, _createHistoryEntry } = get();
    const newEdges = edges.filter((edge) => edge.id !== edgeId);
    _createHistoryEntry({ edges: newEdges });
  },
  cleanUpEdges: () => {
    const { nodes, edges, _createHistoryEntry } = get();
    const nodeIds = new Set(nodes.map((n) => n.id));
    const connectedEdges = edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
    );

    if (connectedEdges.length !== edges.length) {
      _createHistoryEntry({ edges: connectedEdges });
    }
  },
});

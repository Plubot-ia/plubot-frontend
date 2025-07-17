import { applyEdgeChanges, addEdge } from 'reactflow';

import { createSanitizedObject } from '../../utils/object-sanitizer';

// Aunque no se use para iterar, se mantiene como referencia de las propiedades permitidas.
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
    const sanitizedEdges = newEdges.map((edge) => {
      const newEdge = { ...edge };
      // REGLA 1: Eliminar handles inválidos en todas sus formas.
      if (
        newEdge.sourceHandle === null ||
        newEdge.sourceHandle === undefined ||
        newEdge.sourceHandle === 'null'
      ) {
        delete newEdge.sourceHandle;
      }
      if (
        newEdge.targetHandle === null ||
        newEdge.targetHandle === undefined ||
        newEdge.targetHandle === 'null'
      ) {
        delete newEdge.targetHandle;
      }

      // REGLA 2: Forzar el tipo de arista a 'eliteEdge' para nodos complejos.
      const sourceType = nodeTypes.get(edge.source);
      const targetType = nodeTypes.get(edge.target);
      if (
        sourceType === 'decision' ||
        targetType === 'decision' ||
        sourceType === 'option' ||
        targetType === 'option'
      ) {
        newEdge.type = 'eliteEdge';
      }

      return newEdge;
    });

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

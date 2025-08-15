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

  // IMPORTANTE: Si no tiene tipo, usar 'default' que mapea a EliteEdge
  if (!newEdge.type) {
    newEdge.type = 'default';
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
        const visibleEdgeCount = newEdges.filter((edge) => !edge.hidden && !edge.deleted).length;
        const shouldUpdateCount = visibleEdgeCount !== state.edgeCount;

        if (shouldUpdateCount) {
          updateObject.edgeCount = visibleEdgeCount;
        }
      }

      return updateObject;
    });
  },
  setEdges: (newEdges) => {
    const { edges: currentEdges, nodes, _createHistoryEntry } = get();

    // Validación preventiva: filtrar edges con handles undefined antes de sanitización
    if (!newEdges || !Array.isArray(newEdges)) {
      return;
    }

    // DEBUG: Log para rastrear duplicación de aristas (temporalmente deshabilitado)
    // console.log('🔍 setEdges called with:', {
    //   newEdgesCount: newEdges.length,
    //   currentEdgesCount: currentEdges.length,
    //   uniqueNewEdgeIds: [...new Set(newEdges.map(edge => edge.id))].length,
    //   duplicateIds: newEdges.filter((edge, i, arr) => arr.findIndex(x => x.id === edge.id) !== i).map(edge => edge.id)
    // });

    // Logging limpio para edges problemáticos (solo si hay handles undefined)
    const problematicEdges = newEdges.filter(
      (edge) => edge.sourceHandle === undefined || edge.targetHandle === undefined,
    );

    if (problematicEdges.length > 0) {
      // Problematic edges detected
    }

    // Deduplicar aristas por ID antes de sanitizar
    const edgeMap = new Map();
    for (const edge of newEdges) {
      if (edge && edge.id) {
        edgeMap.set(edge.id, edge);
      }
    }
    const deduplicatedEdges = [...edgeMap.values()];

    // DEBUG: Log de deduplicación (temporalmente deshabilitado)
    // console.log('🔍 After deduplication:', {
    //   originalCount: newEdges.length,
    //   deduplicatedCount: deduplicatedEdges.length,
    //   removedDuplicates: newEdges.length - deduplicatedEdges.length
    // });

    // Sanear las aristas después de deduplicar
    const nodeTypes = new Map(nodes.map((node) => [node.id, node.type]));
    const sanitizedEdges = deduplicatedEdges.map((edge) => _sanitizeEdge(edge, nodeTypes));

    if (JSON.stringify(currentEdges) === JSON.stringify(sanitizedEdges)) {
      return;
    }

    _createHistoryEntry({ edges: sanitizedEdges });
  },
  onConnect: (connection) => {
    const { edges, nodes, _createHistoryEntry } = get();

    // VALIDACIÓN PREVENTIVA: Verificar que la conexión tenga handles válidos
    if (!connection || !connection.source || !connection.target) {
      return;
    }

    // Verificar que los handles no sean undefined
    if (connection.sourceHandle === undefined || connection.targetHandle === undefined) {
      return;
    }

    // Verificar que los nodos fuente y destino existan
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);

    if (!sourceNode || !targetNode) {
      return;
    }

    try {
      const newEdges = addEdge(connection, edges);

      // Actualizar contador al agregar edge
      const visibleEdgeCount = newEdges.filter((edge) => !edge.hidden && !edge.deleted).length;
      set({ edgeCount: visibleEdgeCount });

      _createHistoryEntry({ edges: newEdges });
    } catch {
      // Error in onConnect - logged for debugging
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

    // Filtrar edges que tienen nodos válidos Y handles válidos
    const validEdges = edges.filter((edge) => {
      // Verificar que los nodos existan
      const hasValidNodes = nodeIds.has(edge.source) && nodeIds.has(edge.target);

      // Verificar que los handles no sean undefined
      const hasValidHandles = edge.sourceHandle !== undefined && edge.targetHandle !== undefined;

      return hasValidNodes && hasValidHandles;
    });

    if (validEdges.length !== edges.length) {
      _createHistoryEntry({ edges: validEdges });
    }
  },

  // Nueva función para limpiar edges con handles undefined específicamente
  cleanUpInvalidHandleEdges: () => {
    const { edges, _createHistoryEntry } = get();

    const validEdges = edges.filter((edge) => {
      const isValid = edge.sourceHandle !== undefined && edge.targetHandle !== undefined;

      if (!isValid) {
        // Edge will be filtered out
      }

      return isValid;
    });

    if (validEdges.length !== edges.length) {
      _createHistoryEntry({ edges: validEdges });
    }
  },
});

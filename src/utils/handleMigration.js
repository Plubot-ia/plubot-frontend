/**
 * @file handleMigration.js
 * @description Utilidad para migrar handle IDs de MessageNode de 'default' a 'output'
 * manteniendo compatibilidad con flujos existentes
 */

/**
 * Migra handles de MessageNode de 'default' a 'output'
 * @param {Array} edges - Array de aristas del flujo
 * @param {Array} nodes - Array de nodos del flujo
 * @returns {Array} - Array de aristas con handles migrados
 */
export function migrateMessageNodeHandles(edges, nodes) {
  // Crear mapa de tipos de nodos para búsqueda rápida
  const nodeTypeMap = new Map();
  for (const node of nodes) {
    nodeTypeMap.set(node.id, {
      type: node.type,
      isMessageNode: node.type === 'message',
    });
  }

  const migratedEdges = edges.map((edge) => {
    const newEdge = { ...edge };

    // Obtener información de nodos
    const sourceNode = nodeTypeMap.get(edge.source);
    const targetNode = nodeTypeMap.get(edge.target);

    // Verificar si el source es un MessageNode
    if (sourceNode && sourceNode.isMessageNode) {
      // Si el sourceHandle es 'default' o está vacío/undefined, migrarlo a 'output'
      if (edge.sourceHandle === 'default' || !edge.sourceHandle) {
        newEdge.sourceHandle = 'output';
      }

      // También migrar el ID del edge si contiene 'default'
      if (edge.id && edge.id.includes('default')) {
        newEdge.id = edge.id.replace('default', 'output');
      }
    }

    // Verificar si el target es un MessageNode
    if (
      targetNode &&
      targetNode.isMessageNode && // MessageNode siempre usa 'input' para entrada
      (edge.targetHandle === 'default' || !edge.targetHandle)
    ) {
      newEdge.targetHandle = 'input';
    }

    return newEdge;
  });

  return migratedEdges;
}

/**
 * Verifica si las aristas necesitan migración de handles
 * @param {Array} edges - Array de aristas del flujo
 * @param {Array} nodes - Array de nodos del flujo
 * @returns {boolean} - true si necesita migración
 */
export function needsHandleMigration(edges, nodes) {
  // Obtener IDs de MessageNodes
  const messageNodeIds = new Set(
    nodes.filter((node) => node.type === 'message').map((node) => node.id),
  );

  // Buscar aristas que conecten MessageNodes con handles 'default' o vacíos
  return edges.some((edge) => {
    const isSourceMessage = messageNodeIds.has(edge.source);
    const isTargetMessage = messageNodeIds.has(edge.target);

    return (
      (isSourceMessage && (edge.sourceHandle === 'default' || !edge.sourceHandle)) ||
      (isTargetMessage && (edge.targetHandle === 'default' || !edge.targetHandle)) ||
      (edge.id && edge.id.includes('default') && (isSourceMessage || isTargetMessage))
    );
  });
}

/**
 * Aplica migración de handles solo si es necesario
 * @param {Array} edges - Array de aristas del flujo
 * @param {Array} nodes - Array de nodos del flujo
 * @returns {Object} { edges: Array, migrated: boolean }
 */
export function applyHandleMigrationIfNeeded(edges, nodes) {
  if (needsHandleMigration(edges, nodes)) {
    const migratedEdges = migrateMessageNodeHandles(edges, nodes);
    return { edges: migratedEdges, migrated: true };
  }

  return { edges, migrated: false };
}

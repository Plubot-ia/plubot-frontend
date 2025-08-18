/**
 * Valida la integridad de edges antes de sanitización
 */
export const validateEdgesIntegrity = (edges) => {
  if (!edges) return [];

  return edges.filter((edge) => {
    // Skip edges with missing required properties
    if (!edge.id || !edge.source || !edge.target) {
      return false;
    }
    // 🚨 CRÍTICO: NO eliminar edges con handles undefined/null - pueden ser válidos
    // Solo eliminar si el handle es explícitamente la cadena 'undefined'
    const hasInvalidSourceHandle = edge.sourceHandle === 'undefined';
    const hasInvalidTargetHandle = edge.targetHandle === 'undefined';

    // Solo rechazar si AMBOS handles son inválidos
    return !(hasInvalidSourceHandle && hasInvalidTargetHandle);
  });
};

/**
 * Valida que los nodos referenciados en edges existen
 */
export const validateEdgeNodeReferences = (edges, nodes) => {
  const nodeIds = new Set(nodes?.map((n) => n.id) ?? []);
  const validEdges =
    edges?.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)) ?? [];

  const invalidEdges =
    edges?.filter((edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) ?? [];

  return { validEdges, invalidEdges };
};

/**
 * Prepara el estado inicial para la carga de flow
 */
export const prepareLoadingState = () => ({
  isLoaded: false,
  loadError: false,
  nodes: [],
  edges: [],
  flowName: 'Cargando nombre...',
});

/**
 * Prepara el estado final después de la carga exitosa
 */
export const prepareLoadedState = (sanitizedData, plubotId, flowData) => {
  // Calcular contadores iniciales para evitar re-renders innecesarios
  return {
    nodes: sanitizedData.nodes,
    viewport: sanitizedData.viewport,
    nodeCount: sanitizedData.nodes.length, // Inicializar contador de nodos
    edgeCount: sanitizedData.edges.length, // Inicializar contador de edges
    plubotId,
    isLoaded: true,
    hasChanges: false,
    flowName: flowData.name || 'Flujo sin título',
  };
};

/**
 * Prepara el estado de error en caso de fallo en la carga
 */
export const prepareErrorState = () => ({
  loadError: true,
  isLoaded: false,
  flowName: 'Error al cargar',
});

/**
 * @fileoverview Utilidad centralizada para la sanitización del estado del flujo.
 * Este archivo alberga la lógica para limpiar y validar los datos del flujo,
 * asegurando que solo datos válidos entren al store, ya sea desde la API o desde localStorage.
 */

/**
 * Determina si un handle debe ser removido por ser inválido.
 * @param {any} handle - El handle a validar
 * @returns {boolean} true si el handle debe ser removido
 */
const _shouldRemoveHandle = (handle) => {
  return (
    handle === undefined ||
    handle === 'undefined' ||
    handle === 'output' ||
    handle === 'default' ||
    handle === null ||
    handle === ''
  );
};

/**
 * Valida si una arista con sourceHandle 'output' debe ser mantenida.
 * @param {object} edge - La arista a validar
 * @param {Map} nodesMap - Mapa de nodos por ID
 * @returns {boolean} true si la arista debe ser mantenida
 */
const _shouldKeepOutputEdge = (edge, nodesMap) => {
  if (edge.sourceHandle !== 'output') {
    return true; // No es una arista con sourceHandle 'output', mantenerla
  }

  const sourceNodeType = nodesMap.get(edge.source);
  const allowedNodeTypes = ['start', 'aiNodePro'];

  return sourceNodeType && allowedNodeTypes.includes(sourceNodeType);
};

/**
 * Procesa una arista individual aplicando reglas de sanitización.
 * @param {object} edge - La arista a procesar
 * @returns {object|undefined} La arista sanitizada o undefined si es inválida
 */
const _processEdge = (edge) => {
  if (!edge || typeof edge !== 'object') {
    return;
  }

  try {
    const newEdge = { ...edge };

    // REGLA 1: Omitir sourceHandle inválidos (React Flow prefiere ausencia de propiedad)
    if (_shouldRemoveHandle(newEdge.sourceHandle)) {
      delete newEdge.sourceHandle;
    }

    // REGLA 2: Omitir targetHandle inválidos (React Flow prefiere ausencia de propiedad)
    if (_shouldRemoveHandle(newEdge.targetHandle)) {
      delete newEdge.targetHandle;
    }

    return newEdge;
  } catch {}
};

/**
 * Sanitiza el estado del flujo, principalmente eliminando aristas heredadas (legacy) inválidas.
 * @param {object} state - El estado del flujo (que contiene nodos, aristas, etc.).
 * @returns {object} El estado sanitizado.
 */
const sanitizeFlowState = (state) => {
  // Si el estado no es válido o no contiene nodos/aristas, devolverlo sin cambios.
  if (!state || !Array.isArray(state.nodes) || !Array.isArray(state.edges)) {
    return state;
  }

  const nodesMap = new Map(state.nodes.map((node) => [node.id, node.type]));

  const sanitizedEdges = state.edges
    .map((edge) => _processEdge(edge))
    .filter((edge) => _shouldKeepOutputEdge(edge, nodesMap));

  // Devolver siempre el estado con las aristas saneadas. React se encargará de optimizar los re-renders.
  // La integridad de los datos es más importante que una micro-optimización.
  return { ...state, edges: sanitizedEdges };
};

export { sanitizeFlowState };

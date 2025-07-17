/**
 * @fileoverview Utilidad centralizada para la sanitización del estado del flujo.
 * Este archivo alberga la lógica para limpiar y validar los datos del flujo,
 * asegurando que solo datos válidos entren al store, ya sea desde la API o desde localStorage.
 */

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
  const originalEdgeCount = state.edges.length;

  const sanitizedEdges = state.edges
    .map((edge, index) => {
      if (!edge || typeof edge !== 'object') {
        return null;
      }

      try {
        const newEdge = { ...edge };
        let handlesCorrected = false;

        // REGLA 1: Omitir sourceHandle inválidos (React Flow prefiere ausencia de propiedad)
        if (
          newEdge.sourceHandle === undefined ||
          newEdge.sourceHandle === 'undefined' ||
          newEdge.sourceHandle === 'output' ||
          newEdge.sourceHandle === 'default' ||
          newEdge.sourceHandle === null ||
          newEdge.sourceHandle === ''
        ) {
          delete newEdge.sourceHandle;
          handlesCorrected = true;
        }

        // REGLA 2: Omitir targetHandle inválidos (React Flow prefiere ausencia de propiedad)
        if (
          newEdge.targetHandle === undefined ||
          newEdge.targetHandle === 'undefined' ||
          newEdge.targetHandle === 'output' ||
          newEdge.targetHandle === 'default' ||
          newEdge.targetHandle === null ||
          newEdge.targetHandle === ''
        ) {
          delete newEdge.targetHandle;
          handlesCorrected = true;
        }

        return newEdge;
      } catch {
        return null;
      }
    })
    .filter((edge, index) => {
      // REGLA 2: Eliminar aristas con lógica de 'handle' heredada/inválida.
      if (edge.sourceHandle === 'output') {
        const sourceNodeType = nodesMap.get(edge.source);
        const allowedNodeTypes = ['start', 'aiNodePro'];

        if (!sourceNodeType || !allowedNodeTypes.includes(sourceNodeType)) {
          return false; // Eliminar arista.
        }
      }
      return true; // Mantener arista.
    });

  const edgesRemoved = originalEdgeCount - sanitizedEdges.length;

  // Devolver siempre el estado con las aristas saneadas. React se encargará de optimizar los re-renders.
  // La integridad de los datos es más importante que una micro-optimización.
  return { ...state, edges: sanitizedEdges };
};

export { sanitizeFlowState };

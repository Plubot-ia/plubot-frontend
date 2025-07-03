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

  const sanitizedEdges = state.edges.filter((edge) => {
    // REGLA DE SANEAMIENTO v2:
    // El handle 'output' es un handle de salida genérico.
    // Se ha identificado que los nodos 'start' y 'aiNodePro' lo utilizan legítimamente.
    // Para todos los demás nodos, se considera un handle legacy/inválido y debe ser eliminado.
    if (edge.sourceHandle === 'output') {
      const sourceNodeType = nodesMap.get(edge.source);
      const allowedNodeTypes = ['start', 'aiNodePro']; // Nodos que pueden usar 'output' como sourceHandle

      // Si el nodo fuente no existe o su tipo no está en la lista de permitidos, se elimina la arista.
      if (!sourceNodeType || !allowedNodeTypes.includes(sourceNodeType)) {
        return false;
      }
    }
    return true;
  });

  // Si no se eliminó ninguna arista, devolver el estado original para evitar re-renders innecesarios.
  if (sanitizedEdges.length === originalEdgeCount) {
    return state;
  }

  // Devolver una nueva copia del estado con las aristas saneadas.
  return { ...state, edges: sanitizedEdges };
};

export { sanitizeFlowState };

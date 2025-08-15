/**
 * Utilidades para sincronizar aristas entre el estado de la aplicaciu00f3n y el DOM
 */

/**
 * Verifica si hay discrepancias entre las aristas en el estado y las aristas en el DOM
 * @param {Array} edges - Aristas en el estado
 * @returns {Object} - Resultado de la verificaciu00f3n
 */
export const checkEdgeConsistency = (edges) => {
  if (!edges || !Array.isArray(edges)) {
    return {
      consistent: false,
      missingCount: 0,
      edgesInState: 0,
      edgesInDOM: 0,
    };
  }

  // Contar aristas en el estado
  const edgesInState = edges.length;

  // Contar aristas en el DOM
  const edgeElements = document.querySelectorAll('.react-flow__edge');
  const edgesInDOM = edgeElements.length;

  // Verificar si hay discrepancias
  const consistent = edgesInState === edgesInDOM;
  const missingCount = Math.max(0, edgesInState - edgesInDOM);

  return {
    consistent,
    missingCount,
    edgesInState,
    edgesInDOM,
    timestamp: Date.now(),
  };
};

/**
 * Identifica aristas que estu00e1n en el estado pero no en el DOM
 * @param {Array} edges - Aristas en el estado
 * @returns {Array} - Aristas faltantes
 */
export const identifyMissingEdges = (edges) => {
  if (!edges || !Array.isArray(edges)) return [];

  const missingEdges = [];

  // Verificar cada arista en el estado
  for (const edge of edges) {
    if (!edge || !edge.id) continue;

    // Buscar la arista en el DOM
    const edgeElement = document.querySelector(`[data-testid="rf__edge-${edge.id}"]`);
    if (!edgeElement) {
      missingEdges.push(edge);
    }
  }

  return missingEdges;
};

/**
 * Emite eventos para forzar la actualizaciu00f3n de aristas especu00edficas
 * @param {Array} edgeIds - IDs de las aristas a actualizar
 */
export const forceUpdateSpecificEdges = (edgeIds) => {
  if (!edgeIds || !Array.isArray(edgeIds) || edgeIds.length === 0) return;

  // Emitir evento para forzar la actualizaciu00f3n de aristas especu00edficas
  document.dispatchEvent(
    new CustomEvent('force-specific-edges-update', {
      detail: {
        edgeIds,
        timestamp: Date.now(),
      },
    }),
  );
};

/**
 * Verifica y corrige discrepancias entre las aristas en el estado y las aristas en el DOM
 * @param {Array} edges - Aristas en el estado
 * @param {Function} setEdges - Funciu00f3n para establecer las aristas
 * @param {string} plubotId - ID del plubot
 * @returns {Object} - Resultado de la verificaciu00f3n y correcciu00f3n
 */
export const verifyAndFixEdgeConsistency = (edges, setEdges, _plubotId) => {
  // Verificar consistencia
  const consistencyCheck = checkEdgeConsistency(edges);

  // Si hay discrepancias, intentar corregirlas
  if (!consistencyCheck.consistent && consistencyCheck.missingCount > 0) {
    // Identificar aristas faltantes
    const missingEdges = identifyMissingEdges(edges);

    if (missingEdges.length > 0) {
      // Forzar actualizaciu00f3n de aristas especu00edficas
      forceUpdateSpecificEdges(missingEdges.map((edge) => edge.id));

      // Si hay demasiadas aristas faltantes, intentar una actualizaciu00f3n completa del estado
      if (missingEdges.length > edges.length / 3) {
        // Crear una copia profunda de las aristas para forzar una actualización completa
        const edgesCopy = structuredClone(edges);

        // Verificar si setEdges está disponible
        if (setEdges) {
          setEdges(edgesCopy);
        } else {
          // Emitir evento para que otros componentes puedan manejar la actualización
          document.dispatchEvent(
            new CustomEvent('edges-fix-required-no-setter', {
              detail: { edges: edgesCopy, timestamp: Date.now() },
            }),
          );
        }
      }
    }
  }

  return consistencyCheck;
};

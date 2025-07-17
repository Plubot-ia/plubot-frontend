/**
 * Utilidad para limpiar aristas huérfanas del localStorage
 * Diseñado para resolver el problema de conteo incorrecto de aristas
 */

export const cleanupOrphanEdges = () => {
  // Obtener aristas del localStorage
  const localEdges = localStorage.getItem('plubot-flow-edges');
  if (!localEdges) {
    return;
  }

  try {
    // Parsear las aristas
    const parsedEdges = JSON.parse(localEdges);

    // Obtener los IDs de los nodos actuales
    const nodeIds = new Set();
    for (const node of document.querySelectorAll('.react-flow__node')) {
      const nodeId = node.dataset.id;
      if (nodeId) nodeIds.add(nodeId);
    }

    // Filtrar aristas huérfanas
    const validEdges = parsedEdges.filter((edge) => {
      if (!edge || !edge.source || !edge.target) return false;

      const sourceExists = nodeIds.has(edge.source);
      const targetExists = nodeIds.has(edge.target);

      return sourceExists && targetExists;
    });

    const orphanCount = parsedEdges.length - validEdges.length;

    // Guardar solo las aristas válidas
    if (orphanCount > 0) {
      localStorage.setItem('plubot-flow-edges', JSON.stringify(validEdges));

      // Emitir evento para notificar que se han limpiado las aristas
      document.dispatchEvent(
        new CustomEvent('edges-cleaned', {
          detail: {
            orphanCount,
            validCount: validEdges.length,
            timestamp: Date.now(),
          },
        }),
      );

      return {
        orphanCount,
        validCount: validEdges.length,
      };
    } else {
      return {
        orphanCount: 0,
        validCount: validEdges.length,
      };
    }
  } catch (error) {
    return {
      error: true,
      message: error.message,
    };
  }
};

// Función para limpiar todas las aristas (útil para casos extremos)
export const clearAllEdges = () => {
  localStorage.removeItem('plubot-flow-edges');

  // Emitir evento para notificar que se han eliminado todas las aristas
  document.dispatchEvent(
    new CustomEvent('edges-cleared', {
      detail: { timestamp: Date.now() },
    }),
  );
};

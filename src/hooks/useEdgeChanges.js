import { useCallback } from 'react';

// Función pura para aplicar cambios a un array de aristas
const applyEdgeChanges = (changes, edges) => {
  return edges
    .filter((edge) => !changes.some((c) => c.type === 'remove' && c.id === edge.id))
    .map((edge) => {
      const change = changes.find((c) => c.id === edge.id);
      if (!change) return edge;

      switch (change.type) {
        case 'select': {
          return { ...edge, selected: change.selected };
        }
        case 'update': {
          return { ...edge, ...change.updates };
        }
        default: {
          return edge;
        }
      }
    });
};

/**
 * Hook para manejar la lógica de cambios en las aristas del flujo.
 * @param {object} params - Parámetros del hook.
 * @param {object} params.flowStore - La instancia del store de Zustand.
 * @param {object} params.history - La instancia del hook de historial.
 * @param {object} params.optimization - La instancia del hook de optimización.
 * @returns {Function} La función `handleEdgesChange` para ser usada por React Flow.
 */
const useEdgeChanges = ({ flowStore, history, optimization }) => {
  const handleEdgesChange = useCallback(
    (changes) => {
      flowStore.setEdges((previousEdges) => {
        const newEdges = applyEdgeChanges(changes, previousEdges);

        if (changes.some((change) => change.type === 'remove')) {
          history.addToHistory({
            nodes: flowStore.nodes,
            edges: newEdges,
            viewport: flowStore.viewport,
          });
        }

        return newEdges;
      });

      optimization.markActivity();
    },
    [flowStore, history, optimization],
  );

  return handleEdgesChange;
};

export default useEdgeChanges;

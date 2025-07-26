import { useCallback } from 'react';

const handleSelectChange = (node, change) => ({
  ...node,
  selected: change.selected,
});

const handlePositionChange = (node, change) => ({
  ...node,
  position: change.position ?? node.position,
  dragging: change.dragging ?? node.dragging,
});

const handleDimensionsChange = (node, change) => ({
  ...node,
  width: change.dimensions?.width ?? node.width,
  height: change.dimensions?.height ?? node.height,
});

// Función pura para aplicar cambios a un array de nodos
const applyNodeChanges = (changes, nodes) => {
  const changesMap = new Map(changes.map((c) => [c.id, c]));

  return nodes.map((node) => {
    const change = changesMap.get(node.id);
    if (!change) {
      return node;
    }

    switch (change.type) {
      case 'select': {
        return handleSelectChange(node, change);
      }
      case 'position': {
        return handlePositionChange(node, change);
      }
      case 'dimensions': {
        return handleDimensionsChange(node, change);
      }
      default: {
        return node;
      }
    }
  });
};

/**
 * Hook para manejar la lógica de cambios en los nodos del flujo.
 * @param {object} params - Parámetros del hook.
 * @param {object} params.flowStore - La instancia del store de Zustand.
 * @param {object} params.history - La instancia del hook de historial.
 * @param {object} params.optimization - La instancia del hook de optimización.
 * @returns {Function} La función `handleNodesChange` para ser usada por React Flow.
 */
const useNodeChanges = ({ flowStore, history, optimization }) => {
  const handleNodesChange = useCallback(
    (changes) => {
      flowStore.setNodes((previousNodes) => {
        const newNodes = applyNodeChanges(changes, previousNodes);

        const significantChanges = changes.filter(
          (change) => change.type === 'position' && change.dragging === false,
        );

        if (significantChanges.length > 0) {
          history.addToHistory({
            nodes: newNodes,
            edges: flowStore.edges,
            viewport: flowStore.viewport,
          });
        }

        return newNodes;
      });

      optimization.markActivity();
    },
    [flowStore, history, optimization],
  );

  return handleNodesChange;
};

export default useNodeChanges;

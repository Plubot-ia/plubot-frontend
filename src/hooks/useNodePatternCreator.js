import { useCallback } from 'react';

import { PATTERN_TEMPLATES } from '@/flow/nodeConfig';

/**
 * Hook para crear grupos de nodos interconectados según un patrón predefinido.
 * @param {function} createNode - Función para crear un nodo.
 * @param {function} connectNodes - Función para conectar dos nodos.
 * @returns {function} Función para crear un patrón de nodos.
 */
export const useNodePatternCreator = (createNode, connectNodes) => {
  return useCallback(
    (pattern, startPosition) => {
      const createdElements = { nodes: [], edges: [] };
      // El patrón es una clave interna segura, no una entrada de usuario.
      // eslint-disable-next-line security/detect-object-injection
      const template = PATTERN_TEMPLATES[pattern];

      if (!template) {
        const defaultNode = createNode('start', startPosition, {
          label: 'Inicio',
        });
        createdElements.nodes.push(defaultNode);
        return createdElements;
      }

      for (const nodeInfo of template.nodes) {
        const position = {
          x: startPosition.x + nodeInfo.pos.x,
          y: startPosition.y + nodeInfo.pos.y,
        };
        const node = createNode(nodeInfo.type, position, nodeInfo.data);
        createdElements.nodes.push(node);
      }

      for (const edgeInfo of template.edges) {
        const sourceNode = createdElements.nodes[edgeInfo.from];
        const targetNode = createdElements.nodes[edgeInfo.to];
        const edge = connectNodes({
          sourceId: sourceNode.id,
          targetId: targetNode.id,
          sourceHandle: edgeInfo.handle,
          targetHandle: undefined,
          data: edgeInfo.data,
        });
        createdElements.edges.push(edge);
      }

      return createdElements;
    },
    [createNode, connectNodes],
  );
};

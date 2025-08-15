/**
 * Hook personalizado para mejorar la creación de nodos y su integración en el flujo.
 * Proporciona una API optimizada para crear, posicionar y conectar nodos.
 */
import { useCallback, useRef } from 'react';

import { NODE_CONFIG } from '@/flow/nodeConfig';
import { generateId } from '@/services/flowService';

/**
 * Hook para la creación optimizada de nodos y sus conexiones
 * @param {function} addNode - Función para añadir un nodo al flujo
 * @param {function} addEdge - Función para añadir una arista al flujo
 * @param {function} getNodePosition - Función para calcular la posición de un nodo
 * @returns {Object} Métodos para crear y conectar nodos
 */
const configureNodeByType = (nodeBase, type, data) => {
  // eslint-disable-next-line security/detect-object-injection
  const config = NODE_CONFIG[type] ?? {};
  return {
    ...nodeBase,
    data: { ...nodeBase.data, ...config, ...data },
  };
};

const createEdgeObject = ({ sourceId, targetId, sourceHandle, targetHandle, data = {} }) => ({
  id: generateId('edge'),
  source: sourceId,
  target: targetId,
  sourceHandle,
  targetHandle,
  type: data.type ?? 'default',
  animated: data.animated ?? false,
  label: data.label ?? '',
  data: data.data ?? {},
});

const useNodeCreator = (addNode, addEdge, getNodePosition) => {
  const lastCreatedNodeReference = useRef(undefined);

  const createNode = useCallback(
    (type, position, data = {}) => {
      const nodeBase = {
        id: generateId('node'),
        type,
        position,
        data: { ...data, createdAt: Date.now() },
      };

      const configuredNode = configureNodeByType(nodeBase, type, data);
      lastCreatedNodeReference.current = configuredNode;
      addNode(configuredNode);

      return configuredNode;
    },
    [addNode],
  );

  const connectNodes = useCallback(
    (params) => {
      const edge = createEdgeObject(params);
      addEdge(edge);
      return edge;
    },
    [addEdge],
  );

  const createAndConnectNode = useCallback(
    (type, data = {}, edgeData = {}) => {
      const sourceNode = lastCreatedNodeReference.current;

      if (!sourceNode) {
        const newNode = createNode(type, getNodePosition(), data);
        return { node: newNode };
      }

      const position = {
        x: sourceNode.position.x + 250,
        y: sourceNode.position.y,
      };

      // Crear el nuevo nodo
      const newNode = createNode(type, position, data);

      // Conectar con el nodo anterior
      const edge = connectNodes({
        sourceId: sourceNode.id,
        targetId: newNode.id,
        sourceHandle: edgeData.sourceHandle,
        targetHandle: edgeData.targetHandle,
        data: edgeData,
      });

      return { node: newNode, edge };
    },
    [createNode, connectNodes, getNodePosition],
  );

  return {
    createNode,
    connectNodes,
    createAndConnectNode,
    getLastCreatedNode: () => lastCreatedNodeReference.current,
  };
};

export default useNodeCreator;

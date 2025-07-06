/**
 * Hook personalizado para mejorar la creación de nodos y su integración en el flujo.
 * Proporciona una API optimizada para crear, posicionar y conectar nodos.
 */
import { useCallback, useRef } from 'react';

import { generateId } from '@/services/flowService';

/**
 * Hook para la creación optimizada de nodos y sus conexiones
 * @param {function} addNode - Función para añadir un nodo al flujo
 * @param {function} addEdge - Función para añadir una arista al flujo
 * @param {function} getNodePosition - Función para calcular la posición de un nodo
 * @returns {Object} Métodos para crear y conectar nodos
 */
const useNodeCreator = (addNode, addEdge, getNodePosition) => {
  const lastCreatedNodeReference = useRef(undefined);

  const configureNodeByType = useCallback((nodeBase, type, data = {}) => {
    const NODE_CONFIG = {
      start: {
        label: 'Inicio',
        message: 'Bienvenido a la conversación',
      },
      message: {
        label: 'Mensaje',
        message: 'Escribe tu mensaje aquí',
      },
      decision: {
        label: 'Decisión',
        condition: 'Condición',
        options: [],
      },
      action: {
        label: 'Acción',
        actionType: 'custom',
        parameters: {},
      },
      end: {
        label: 'Fin',
        message: 'Fin de la conversación',
      },
    };

    let config = {};
    switch (type) {
      case 'start': {
        config = NODE_CONFIG.start;
        break;
      }
      case 'message': {
        config = NODE_CONFIG.message;
        break;
      }
      case 'decision': {
        config = NODE_CONFIG.decision;
        break;
      }
      case 'action': {
        config = NODE_CONFIG.action;
        break;
      }
      case 'end': {
        config = NODE_CONFIG.end;
        break;
      }
      default: {
        config = {};
        break;
      }
    }

    return {
      ...nodeBase,
      data: {
        ...nodeBase.data,
        ...config,
        ...data,
      },
    };
  }, []);

  const createNode = useCallback(
    (type, position, data = {}) => {
      const nodeId = generateId('node');

      const nodeBase = {
        id: nodeId,
        type,
        position,
        data: {
          ...data,
          createdAt: Date.now(),
        },
      };

      const configuredNode = configureNodeByType(nodeBase, type, data);

      lastCreatedNodeReference.current = configuredNode;

      addNode(configuredNode);

      return configuredNode;
    },
    [addNode, configureNodeByType],
  );

  const connectNodes = useCallback(
    (sourceId, targetId, sourceHandle, targetHandle, data = {}) => {
      const edgeId = generateId('edge');

      const edge = {
        id: edgeId,
        source: sourceId,
        target: targetId,
        sourceHandle,
        targetHandle,
        type: data.type || 'default',
        animated: data.animated || false,
        label: data.label || '',
        data: data.data || {},
      };

      addEdge(edge);

      return edge;
    },
    [addEdge],
  );

  /**
   * Crea un nodo y lo conecta automáticamente al último nodo creado
   * @param {string} type - Tipo de nodo a crear
   * @param {Object} data - Datos adicionales del nodo
   * @param {Object} edgeData - Datos para la arista de conexión
   * @returns {Object} Objeto con el nodo y la arista creados
   */
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
      const edge = connectNodes(
        sourceNode.id,
        newNode.id,
        edgeData.sourceHandle,
        edgeData.targetHandle,
        edgeData,
      );

      return { node: newNode, edge };
    },
    [createNode, connectNodes, getNodePosition],
  );

  /**
   * Crea un grupo de nodos interconectados según un patrón predefinido
   * @param {string} pattern - Patrón a crear ('secuencia', 'decision', etc.)
   * @param {Object} startPosition - Posición inicial para el primer nodo
   * @returns {Object} Nodos y aristas creados
   */
  const createNodePattern = useCallback(
    (pattern, startPosition) => {
      const createdElements = { nodes: [], edges: [] };
      const PATTERN_TEMPLATES = {
        secuencia: {
          nodes: [
            { type: 'start', pos: { x: 0, y: 0 }, data: { label: 'Inicio' } },
            {
              type: 'message',
              pos: { x: 250, y: 0 },
              data: { label: 'Mensaje', message: 'Escribe tu mensaje aquí' },
            },
            { type: 'end', pos: { x: 500, y: 0 }, data: { label: 'Fin' } },
          ],
          edges: [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
          ],
        },
        decision: {
          nodes: [
            { type: 'start', pos: { x: 0, y: 0 }, data: { label: 'Inicio' } },
            {
              type: 'message',
              pos: { x: 250, y: 0 },
              data: { label: 'Pregunta', message: '¿Estás de acuerdo?' },
            },
            {
              type: 'decision',
              pos: { x: 500, y: 0 },
              data: { label: 'Decisión', options: ['Sí', 'No'] },
            },
            {
              type: 'message',
              pos: { x: 750, y: -100 },
              data: { label: 'Respuesta Sí', message: '¡Excelente!' },
            },
            {
              type: 'message',
              pos: { x: 750, y: 100 },
              data: {
                label: 'Respuesta No',
                message: 'Entendido, no hay problema.',
              },
            },
            { type: 'end', pos: { x: 1000, y: 0 }, data: { label: 'Fin' } },
          ],
          edges: [
            { from: 0, to: 1 },
            { from: 1, to: 2 },
            { from: 2, to: 3, handle: 'yes', data: { label: 'Sí' } },
            { from: 2, to: 4, handle: 'no', data: { label: 'No' } },
            { from: 3, to: 5 },
            { from: 4, to: 5 },
          ],
        },
      };

      let template;
      switch (pattern) {
        case 'secuencia': {
          template = PATTERN_TEMPLATES.secuencia;
          break;
        }
        case 'decision': {
          template = PATTERN_TEMPLATES.decision;
          break;
        }
        default: {
          template = undefined;
          break;
        }
      }

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
        const edge = connectNodes(
          sourceNode.id,
          targetNode.id,
          edgeInfo.handle,
          undefined,
          edgeInfo.data,
        );
        createdElements.edges.push(edge);
      }

      return createdElements;
    },
    [createNode, connectNodes],
  );

  return {
    createNode,
    connectNodes,
    createAndConnectNode,
    createNodePattern,
    getLastCreatedNode: () => lastCreatedNodeReference.current,
  };
};

export default useNodeCreator;

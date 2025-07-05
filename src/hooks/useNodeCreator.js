/**
 * Hook personalizado para mejorar la creaciu00f3n de nodos y su integraciu00f3n en el flujo.
 * Proporciona una API optimizada para crear, posicionar y conectar nodos.
 */
import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { generateId } from '@/services/flowService';

/**
 * Hook para la creaciu00f3n optimizada de nodos y sus conexiones
 * @param {function} addNode - Funciu00f3n para au00f1adir un nodo al flujo
 * @param {function} addEdge - Funciu00f3n para au00f1adir una arista al flujo
 * @param {function} getNodePosition - Funciu00f3n para calcular la posiciu00f3n de un nodo
 * @returns {Object} Mu00e9todos para crear y conectar nodos
 */
const useNodeCreator = (addNode, addEdge, getNodePosition) => {
  const lastCreatedNodeReference = useRef(undefined);

  const configureNodeByType = useCallback((nodeBase, type, data = {}) => {
    const node = { ...nodeBase };

    switch (type) {
      case 'start': {
        node.data = {
          ...node.data,
          label: data.label || 'Inicio',
          message: data.message || 'Bienvenido a la conversaciu00f3n',
        };
        break;
      }
      case 'message': {
        node.data = {
          ...node.data,
          label: data.label || 'Mensaje',
          message: data.message || 'Escribe tu mensaje aquu00ed',
        };
        break;
      }
      case 'decision': {
        node.data = {
          ...node.data,
          label: data.label || 'Decisiu00f3n',
          condition: data.condition || 'Condiciu00f3n',
          options: data.options || [],
        };
        break;
      }
      case 'action': {
        node.data = {
          ...node.data,
          label: data.label || 'Acciu00f3n',
          actionType: data.actionType || 'custom',
          parameters: data.parameters || {},
        };
        break;
      }
      case 'end': {
        node.data = {
          ...node.data,
          label: data.label || 'Fin',
          message: data.message || 'Fin de la conversaciu00f3n',
        };
        break;
      }
      default: {
        break;
      }
    }

    return node;
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
   * Crea un nodo y lo conecta automu00e1ticamente al u00faltimo nodo creado
   * @param {string} type - Tipo de nodo a crear
   * @param {Object} data - Datos adicionales del nodo
   * @param {Object} edgeData - Datos para la arista de conexiu00f3n
   * @returns {Object} Objeto con el nodo y la arista creados
   */
  const createAndConnectNode = useCallback(
    (type, data = {}, edgeData = {}) => {
      // Obtener nodo de origen (el u00faltimo creado)
      const sourceNode = lastCreatedNodeReference.current;

      // Si no hay nodo anterior, solo crear el nuevo
      if (!sourceNode) {
        const newNode = createNode(type, getNodePosition(), data);
        return { node: newNode };
      }

      // Calcular posiciu00f3n para el nuevo nodo (a la derecha del anterior)
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
   * Crea un grupo de nodos interconectados segu00fan un patru00f3n predefinido
   * @param {string} pattern - Patru00f3n a crear ('secuencia', 'decisiu00f3n', etc.)
   * @param {Object} startPosition - Posiciu00f3n inicial para el primer nodo
   * @returns {Object} Nodos y aristas creados
   */
  const createNodePattern = useCallback(
    (pattern, startPosition) => {
      const createdElements = { nodes: [], edges: [] };

      switch (pattern) {
        case 'secuencia': {
          // Crear secuencia bu00e1sica: Inicio -> Mensaje -> Fin
          const startNode = createNode('start', startPosition, {
            label: 'Inicio',
          });
          createdElements.nodes.push(startNode);

          const messageNode = createNode(
            'message',
            { x: startPosition.x + 250, y: startPosition.y },
            { label: 'Mensaje', message: 'Escribe tu mensaje aquu00ed' },
          );
          createdElements.nodes.push(messageNode);

          const endNode = createNode(
            'end',
            { x: startPosition.x + 500, y: startPosition.y },
            { label: 'Fin' },
          );
          createdElements.nodes.push(endNode);

          // Conectar nodos
          const edge1 = connectNodes(startNode.id, messageNode.id);
          const edge2 = connectNodes(messageNode.id, endNode.id);

          createdElements.edges.push(edge1, edge2);
          break;
        }

        case 'decision': {
          // Crear patru00f3n de decisiu00f3n: Inicio -> Mensaje -> Decisiu00f3n -> (Su00ed/No) -> Fin
          const start = createNode('start', startPosition, { label: 'Inicio' });
          createdElements.nodes.push(start);

          const question = createNode(
            'message',
            { x: startPosition.x + 250, y: startPosition.y },
            { label: 'Pregunta', message: 'u00bfEstu00e1s de acuerdo?' },
          );
          createdElements.nodes.push(question);

          const decision = createNode(
            'decision',
            { x: startPosition.x + 500, y: startPosition.y },
            { label: 'Decisiu00f3n', options: ['Su00ed', 'No'] },
          );
          createdElements.nodes.push(decision);

          const yesResponse = createNode(
            'message',
            { x: startPosition.x + 750, y: startPosition.y - 100 },
            { label: 'Respuesta Su00ed', message: '\u00A1Excelente!' },
          );
          createdElements.nodes.push(yesResponse);

          const noResponse = createNode(
            'message',
            { x: startPosition.x + 750, y: startPosition.y + 100 },
            { label: 'Respuesta No', message: 'Entendido, no hay problema.' },
          );
          createdElements.nodes.push(noResponse);

          const end = createNode(
            'end',
            { x: startPosition.x + 1000, y: startPosition.y },
            { label: 'Fin' },
          );
          createdElements.nodes.push(end);

          // Conectar nodos
          createdElements.edges.push(connectNodes(start.id, question.id));
          createdElements.edges.push(connectNodes(question.id, decision.id));
          createdElements.edges.push(
            connectNodes(decision.id, yesResponse.id, 'yes', null, {
              label: 'Su00ed',
            }),
          );
          createdElements.edges.push(
            connectNodes(decision.id, noResponse.id, 'no', null, {
              label: 'No',
            }),
          );
          createdElements.edges.push(connectNodes(yesResponse.id, end.id));
          createdElements.edges.push(connectNodes(noResponse.id, end.id));
          break;
        }

        default: {
          // Caso por defecto, solo crear un nodo de inicio
          const defaultNode = createNode('start', startPosition, {
            label: 'Inicio',
          });
          createdElements.nodes.push(defaultNode);
        }
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

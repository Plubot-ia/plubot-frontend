/**
 * @file flow-nodes-utilities.js
 * @description Utilidades para gestión de nodos en el editor de flujo
 * Extraído de useFlowNodes.js para reducir max-lines-per-function
 */

import { applyNodeChanges } from 'reactflow';

import { generateNodeId } from './flowEditorUtilities';

/**
 * Maneja cambios en los nodos (arrastrar, seleccionar, etc)
 * @param {Array} changes - Cambios a aplicar
 * @param {Object} context - Contexto con nodes, nodesMap, setNodes y addToHistory
 * @returns {Array} Nuevos nodos actualizados
 */
export function handleNodesChange(changes, context) {
  const { nodes, nodesMap, setNodes, addToHistory } = context;
  // Aplicar cambios a los nodos internos
  const newNodes = applyNodeChanges(changes, nodes);

  // Actualizar el mapa de nodos
  for (const change of changes) {
    if (change.type === 'remove') {
      nodesMap.delete(change.id);
    } else {
      const updatedNode = newNodes.find((n) => n.id === change.id);
      if (updatedNode) {
        nodesMap.set(change.id, updatedNode);
      }
    }
  }

  // Propagar cambios al componente padre
  setTimeout(() => setNodes(newNodes), 0);

  // Registrar cambios en el historial si es necesario
  const positionChanges = changes.filter(
    (change) => change.type === 'position' && change.dragging === false,
  );

  if (positionChanges.length > 0) {
    const movedNodes = positionChanges
      .map((change) => {
        const node = nodesMap.get(change.id);
        // Verificar que el nodo y su posición existan
        if (node && node.position) {
          return { id: change.id, position: { ...node.position } };
        }
        // o null, pero undefined es más idiomático aquí y se filtrará igual
      })
      .filter(Boolean); // Filtrar nodos nulos

    // Solo agregar al historial si hay nodos válidos
    if (movedNodes.length > 0) {
      addToHistory({
        type: 'move',
        nodes: movedNodes,
      });
    }
  }

  return newNodes;
}

/**
 * Agrega un nuevo nodo al flujo
 * @param {Object} nodeConfig - Configuración del nodo (nodeType, position, data)
 * @param {Object} context - Contexto con nodes, nodesMap, setNodes y addToHistory
 * @returns {Object} Nuevo nodo creado
 */
export function addFlowNode(nodeConfig, context) {
  const { nodeType, position, data = {} } = nodeConfig;
  const { nodes, nodesMap, setNodes, addToHistory } = context;
  // Generar un ID único para el nodo
  const nodeId = generateNodeId(nodeType);

  // Crear el nuevo nodo con el ID original preservado
  const newNode = {
    id: nodeId,
    type: nodeType,
    position,
    data: { ...data },
    // Guardar el ID original para evitar problemas al guardar/cargar
    originalId: nodeId,
  };

  const newNodes = [...nodes, newNode];
  nodesMap.set(newNode.id, newNode);
  setTimeout(() => setNodes(newNodes), 0);

  addToHistory({
    type: 'add',
    nodes: [newNode],
  });

  return newNode;
}

/**
 * Elimina un nodo del flujo
 * @param {string} nodeId - ID del nodo a eliminar
 * @param {Object} context - Contexto con nodes, nodesMap, setNodes y addToHistory
 * @returns {Array} Nuevos nodos sin el nodo eliminado
 */
export function removeFlowNode(nodeId, context) {
  const { nodes, nodesMap, setNodes, addToHistory } = context;
  const nodeToRemove = nodes.find((n) => n.id === nodeId);
  if (!nodeToRemove) return nodes;

  const newNodes = nodes.filter((n) => n.id !== nodeId);
  nodesMap.delete(nodeId);
  setTimeout(() => setNodes(newNodes), 0);

  addToHistory({
    type: 'remove',
    nodes: [nodeToRemove],
  });

  return newNodes;
}

/**
 * Actualiza los datos de un nodo
 * @param {string} nodeId - ID del nodo a actualizar
 * @param {Object} newData - Nuevos datos del nodo
 * @param {Object} context - Contexto con nodes, nodesMap y setNodes
 * @returns {Array} Nuevos nodos actualizados
 */
export function updateFlowNodeData(nodeId, newData, context) {
  const { nodes, nodesMap, setNodes } = context;
  const newNodes = nodes.map((node) => {
    if (node.id === nodeId) {
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          ...newData,
        },
      };
      nodesMap.set(nodeId, updatedNode);
      return updatedNode;
    }
    return node;
  });

  setTimeout(() => setNodes(newNodes), 0);
  return newNodes;
}

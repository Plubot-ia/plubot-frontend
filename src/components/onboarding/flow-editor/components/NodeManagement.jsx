import { useCallback } from 'react';

import useFlowStore from '@/stores/use-flow-store';
import useTrainingStore from '@/stores/use-training-store';

import { useNodeDataHelpers } from './NodeManagement.helpers';

/**
 * Hook para la gestión de nodos en el editor de flujos
 * Utiliza directamente los stores de Zustand para acceder al estado y las acciones
 */
export const useNodeManagement = () => {
  // Obtener estado y acciones del store de Flow
  const { nodes, edges, addNode, removeNode, updateNode, setSelectedNode, removeEdge } =
    useFlowStore();

  // Obtener acciones del store de Training
  const { setByteMessage } = useTrainingStore();

  // Obtener helpers de preparación de datos
  const { prepareNodeData, adjustPositionToGrid } = useNodeDataHelpers();

  /**
   * Crea un nuevo nodo en la posición especificada
   */
  const createNode = useCallback(
    (type, position, customData = {}) => {
      const initialData = prepareNodeData(type, customData);
      if (!initialData) return;

      const adjustedPosition = adjustPositionToGrid(position);

      // Añadir el nodo
      const newNode = addNode(type, adjustedPosition, initialData);
      setSelectedNode(newNode);
      setByteMessage('Nodo creado');

      return newNode;
    },
    [addNode, setSelectedNode, setByteMessage, prepareNodeData, adjustPositionToGrid],
  );

  /**
   * Elimina un nodo y sus conexiones
   */
  const deleteNode = useCallback(
    (nodeId) => {
      if (!nodeId) return;

      // Eliminar conexiones relacionadas con el nodo
      const connectedEdges = edges.filter(
        (edge) => edge.source === nodeId || edge.target === nodeId,
      );

      // Eliminar cada arista conectada
      for (const edge of connectedEdges) {
        removeEdge(edge.id);
      }

      // Eliminar el nodo
      removeNode(nodeId);
      setSelectedNode(undefined);
      setByteMessage('Nodo eliminado');
    },
    [edges, removeEdge, removeNode, setSelectedNode, setByteMessage],
  );

  /**
   * Actualiza los datos de un nodo
   */
  const updateNodeData = useCallback(
    (nodeId, newData) => {
      if (!nodeId) return;

      updateNode(nodeId, { data: { ...newData } });
      setByteMessage('Nodo actualizado');
    },
    [updateNode, setByteMessage],
  );

  /**
   * Duplica un nodo existente
   */
  const duplicateNode = useCallback(
    (nodeId) => {
      const nodeToClone = nodes.find((node) => node.id === nodeId);
      if (!nodeToClone) return;

      // Crear una nueva posición ligeramente desplazada
      const newPosition = {
        x: nodeToClone.position.x + 50,
        y: nodeToClone.position.y + 50,
      };

      // Clonar el nodo con nuevos datos
      const newNode = addNode(nodeToClone.type, newPosition, {
        ...nodeToClone.data,
        label: `${nodeToClone.data.label} (copia)`,
      });

      setSelectedNode(newNode);
      setByteMessage('Nodo duplicado');

      return newNode;
    },
    [nodes, addNode, setSelectedNode, setByteMessage],
  );

  return {
    createNode,
    deleteNode,
    updateNodeData,
    duplicateNode,
  };
};

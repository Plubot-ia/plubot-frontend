import React, { useCallback } from 'react';

import useTrainingStore from '@/stores/use-training-store';
import { nodeConfig } from '@/utils/node-config.js';

import useFlowStore from '@/stores/useFlowStore';

/**
 * Hook para la gestión de nodos en el editor de flujos
 * Utiliza directamente los stores de Zustand para acceder al estado y las acciones
 */
export const useNodeManagement = () => {
  // Obtener estado y acciones del store de Flow
  const {
    nodes,
    edges,
    addNode,
    removeNode,
    updateNode,
    setSelectedNode,
    removeEdge,
  } = useFlowStore();

  // Obtener acciones del store de Training
  const { setByteMessage } = useTrainingStore();

  /**
   * Crea un nuevo nodo en la posición especificada
   */
  const createNode = useCallback(
    (type, position, customData = {}) => {
      // Obtener configuración del tipo de nodo
      const nodeType = nodeConfig[type];
      if (!nodeType) {
        return;
      }

      // Crear datos iniciales para el nodo
      const initialData = {
        label: nodeType.label || 'Nuevo Nodo',
        ...nodeType.defaultData,
        ...customData,
      };

      // Ajustar la posición al grid
      const adjustedPosition = {
        x: Math.round(position.x / 15) * 15,
        y: Math.round(position.y / 15) * 15,
      };

      // Añadir el nodo
      const newNode = addNode(type, adjustedPosition, initialData);
      setSelectedNode(newNode);
      setByteMessage('Nodo creado');

      return newNode;
    },
    [addNode, setSelectedNode, setByteMessage],
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
      const nodeToClone = nodes.find((n) => n.id === nodeId);
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

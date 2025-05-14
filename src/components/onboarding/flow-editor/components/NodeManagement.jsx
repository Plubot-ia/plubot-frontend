import React, { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { nodeConfig } from '@/utils/nodeConfig';
import { generateNodeId } from '../utils/flowEditorUtils';

/**
 * Componente para la gestión de nodos en el editor de flujos
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.nodesState - Estado y funciones para gestionar nodos
 * @param {Object} props.edgesState - Estado y funciones para gestionar aristas
 * @param {Function} props.setSelectedNode - Función para establecer el nodo seleccionado
 * @param {Function} props.setStatusMessage - Función para establecer mensajes de estado
 */
const NodeManagement = ({
  nodesState,
  edgesState,
  setSelectedNode,
  setStatusMessage,
}) => {
  const { nodes, addNode, removeNode, updateNodeData } = nodesState;
  const { removeConnectedEdges } = edgesState;
  const reactFlowInstance = useReactFlow();

  /**
   * Crea un nuevo nodo en la posición especificada
   */
  const createNode = useCallback((type, position) => {
    // Obtener configuración del tipo de nodo
    const nodeType = nodeConfig[type];
    if (!nodeType) {
      console.error(`Tipo de nodo desconocido: ${type}`);
      return null;
    }

    // Crear datos iniciales para el nodo
    const initialData = {
      label: nodeType.label || 'Nuevo Nodo',
      ...nodeType.defaultData,
    };

    // Ajustar la posición al grid
    const adjustedPosition = {
      x: Math.round(position.x / 15) * 15,
      y: Math.round(position.y / 15) * 15,
    };

    // Añadir el nodo
    const newNode = addNode(type, adjustedPosition, initialData);
    setSelectedNode(newNode);
    setStatusMessage('Nodo creado');

    return newNode;
  }, [addNode, setSelectedNode, setStatusMessage]);

  /**
   * Elimina un nodo y sus conexiones
   */
  const deleteNode = useCallback((nodeId) => {
    if (!nodeId) return;

    // Eliminar conexiones primero
    removeConnectedEdges(nodeId);
    
    // Eliminar el nodo
    removeNode(nodeId);
    setSelectedNode(null);
    setStatusMessage('Nodo eliminado');
  }, [removeConnectedEdges, removeNode, setSelectedNode, setStatusMessage]);

  /**
   * Actualiza los datos de un nodo
   */
  const updateNode = useCallback((nodeId, newData) => {
    if (!nodeId) return;

    updateNodeData(nodeId, newData);
    setStatusMessage('Nodo actualizado');
  }, [updateNodeData, setStatusMessage]);

  /**
   * Duplica un nodo existente
   */
  const duplicateNode = useCallback((nodeId) => {
    const nodeToClone = nodes.find(n => n.id === nodeId);
    if (!nodeToClone) return;

    // Crear una nueva posición ligeramente desplazada
    const newPosition = {
      x: nodeToClone.position.x + 50,
      y: nodeToClone.position.y + 50,
    };

    // Clonar el nodo con nuevos datos
    const newNode = addNode(
      nodeToClone.type,
      newPosition,
      { ...nodeToClone.data, label: `${nodeToClone.data.label} (copia)` }
    );

    setSelectedNode(newNode);
    setStatusMessage('Nodo duplicado');

    return newNode;
  }, [nodes, addNode, setSelectedNode, setStatusMessage]);

  return null; // Este componente no renderiza nada, solo proporciona funcionalidad
};

export default NodeManagement;

// Exportar las funciones para usar directamente
export const useNodeManagement = (props) => {
  const {
    nodesState,
    edgesState,
    setSelectedNode,
    setStatusMessage,
  } = props;

  const { nodes, addNode, removeNode, updateNodeData } = nodesState;
  const { removeConnectedEdges } = edgesState;
  const reactFlowInstance = useReactFlow();

  /**
   * Crea un nuevo nodo en la posición especificada
   */
  const createNode = useCallback((type, position) => {
    // Obtener configuración del tipo de nodo
    const nodeType = nodeConfig[type];
    if (!nodeType) {
      console.error(`Tipo de nodo desconocido: ${type}`);
      return null;
    }

    // Crear datos iniciales para el nodo
    const initialData = {
      label: nodeType.label || 'Nuevo Nodo',
      ...nodeType.defaultData,
    };

    // Ajustar la posición al grid
    const adjustedPosition = {
      x: Math.round(position.x / 15) * 15,
      y: Math.round(position.y / 15) * 15,
    };

    // Añadir el nodo
    const newNode = addNode(type, adjustedPosition, initialData);
    setSelectedNode(newNode);
    setStatusMessage('Nodo creado');

    return newNode;
  }, [addNode, setSelectedNode, setStatusMessage]);

  /**
   * Elimina un nodo y sus conexiones
   */
  const deleteNode = useCallback((nodeId) => {
    if (!nodeId) return;

    // Eliminar conexiones primero
    removeConnectedEdges(nodeId);
    
    // Eliminar el nodo
    removeNode(nodeId);
    setSelectedNode(null);
    setStatusMessage('Nodo eliminado');
  }, [removeConnectedEdges, removeNode, setSelectedNode, setStatusMessage]);

  /**
   * Actualiza los datos de un nodo
   */
  const updateNode = useCallback((nodeId, newData) => {
    if (!nodeId) return;

    updateNodeData(nodeId, newData);
  }, [updateNodeData]);

  /**
   * Duplica un nodo existente
   */
  const duplicateNode = useCallback((nodeId) => {
    const nodeToClone = nodes.find(n => n.id === nodeId);
    if (!nodeToClone) return;

    // Crear una nueva posición ligeramente desplazada
    const newPosition = {
      x: nodeToClone.position.x + 50,
      y: nodeToClone.position.y + 50,
    };

    // Clonar el nodo con nuevos datos
    const newNode = addNode(
      nodeToClone.type,
      newPosition,
      { ...nodeToClone.data, label: `${nodeToClone.data.label} (copia)` }
    );

    setSelectedNode(newNode);
    setStatusMessage('Nodo duplicado');

    return newNode;
  }, [nodes, addNode, setSelectedNode, setStatusMessage]);

  return {
    createNode,
    deleteNode,
    updateNode,
    duplicateNode,
  };
};

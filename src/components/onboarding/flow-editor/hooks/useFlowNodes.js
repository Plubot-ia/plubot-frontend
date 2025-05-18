import { useState, useCallback, useEffect, useRef } from 'react';
import { applyNodeChanges } from 'reactflow';
import { generateNodeId } from '../utils/flowEditorUtils';

/**
 * Hook personalizado para la gestión de nodos en el editor de flujos
 * @param {Array} initialNodes - Nodos iniciales
 * @param {Function} setNodes - Función para actualizar nodos en el componente padre
 * @param {Function} addToHistory - Función para añadir cambios al historial
 * @returns {Object} - Métodos y estado para gestionar nodos
 */
const useFlowNodes = (initialNodes, setNodes, addToHistory) => {
  // Estado interno para nodos
  const [internalNodes, setInternalNodes] = useState(initialNodes || []);
  
  // Map para acceso rápido a nodos por ID
  const nodesMapRef = useRef(new Map());
  
  // Inicializar el mapa de nodos
  useEffect(() => {
    const nodesMap = new Map();
    initialNodes.forEach(node => {
      nodesMap.set(node.id, node);
    });
    nodesMapRef.current = nodesMap;
    setInternalNodes(initialNodes);
  }, [initialNodes]);

  /**
   * Maneja cambios en los nodos (arrastrar, seleccionar, etc)
   */
  const onNodesChange = useCallback((changes) => {
    // Aplicar cambios a los nodos internos
    setInternalNodes(nodes => {
      const newNodes = applyNodeChanges(changes, nodes);
      
      // Actualizar el mapa de nodos
      const nodesMap = nodesMapRef.current;
      changes.forEach(change => {
        if (change.type === 'remove') {
          nodesMap.delete(change.id);
        } else {
          const updatedNode = newNodes.find(n => n.id === change.id);
          if (updatedNode) {
            nodesMap.set(change.id, updatedNode);
          }
        }
      });
      
      // Propagar cambios al componente padre
      setTimeout(() => setNodes(newNodes), 0);
      
      // Registrar cambios en el historial si es necesario
      const positionChanges = changes.filter(change => 
        change.type === 'position' && change.dragging === false
      );
      
      if (positionChanges.length > 0) {
        const movedNodes = positionChanges.map(change => {
          const node = nodesMap.get(change.id);
          // Verificar que el nodo y su posición existan
          if (node && node.position) {
            return { id: change.id, position: { ...node.position } };
          }
          return null;
        }).filter(Boolean); // Filtrar nodos nulos
        
        // Solo agregar al historial si hay nodos válidos
        if (movedNodes.length > 0) {
          addToHistory({
            type: 'move',
            nodes: movedNodes,
          });
        }
      }
      
      return newNodes;
    });
  }, [setNodes, addToHistory]);

  /**
   * Añade un nuevo nodo al flujo
   */
  const addNode = useCallback((nodeType, position, data = {}) => {
    // Generar un ID único para el nodo
    const nodeId = generateNodeId(nodeType);
    
    // Crear el nuevo nodo con el ID original preservado
    const newNode = {
      id: nodeId,
      type: nodeType,
      position,
      data: { ...data },
      // Guardar el ID original para evitar problemas al guardar/cargar
      originalId: nodeId
    };
    
    setInternalNodes(nodes => {
      const newNodes = [...nodes, newNode];
      nodesMapRef.current.set(newNode.id, newNode);
      setTimeout(() => setNodes(newNodes), 0);
      return newNodes;
    });
    
    addToHistory({
      type: 'add',
      nodes: [newNode],
    });
    
    return newNode;
  }, [setNodes, addToHistory]);

  /**
   * Elimina un nodo del flujo
   */
  const removeNode = useCallback((nodeId) => {
    setInternalNodes(nodes => {
      const nodeToRemove = nodes.find(n => n.id === nodeId);
      if (!nodeToRemove) return nodes;
      
      const newNodes = nodes.filter(n => n.id !== nodeId);
      nodesMapRef.current.delete(nodeId);
      setTimeout(() => setNodes(newNodes), 0);
      
      addToHistory({
        type: 'remove',
        nodes: [nodeToRemove],
      });
      
      return newNodes;
    });
  }, [setNodes, addToHistory]);

  /**
   * Actualiza los datos de un nodo
   */
  const updateNodeData = useCallback((nodeId, newData) => {
    setInternalNodes(nodes => {
      const newNodes = nodes.map(node => {
        if (node.id === nodeId) {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              ...newData,
            },
          };
          nodesMapRef.current.set(nodeId, updatedNode);
          return updatedNode;
        }
        return node;
      });
      
      setTimeout(() => setNodes(newNodes), 0);
      return newNodes;
    });
  }, [setNodes]);

  return {
    nodes: internalNodes,
    nodesMap: nodesMapRef.current,
    onNodesChange,
    addNode,
    removeNode,
    updateNodeData,
  };
};

export default useFlowNodes;

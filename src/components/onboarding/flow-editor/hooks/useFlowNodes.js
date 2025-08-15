import { useState, useCallback, useEffect, useRef } from 'react';

import {
  handleNodesChange,
  addFlowNode,
  removeFlowNode,
  updateFlowNodeData,
} from '../utils/flow-nodes-utilities.js';

/**
 * Hook personalizado para la gestión de nodos en el editor de flujos
 * @param {Array} initialNodes - Nodos iniciales
 * @param {Function} setNodes - Función para actualizar nodos en el componente padre
 * @param {Function} addToHistory - Función para añadir cambios al historial
 * @returns {Object} - Métodos y estado para gestionar nodos
 */
const useFlowNodes = (initialNodes, setNodes, addToHistory) => {
  // Estado interno para nodos
  const [internalNodes, setInternalNodes] = useState(initialNodes ?? []);
  // Map para acceso rápido a nodos por ID
  const nodesMapReference = useRef(new Map());

  // Inicializar el mapa de nodos
  useEffect(() => {
    const nodesMap = new Map();
    for (const node of initialNodes) {
      nodesMap.set(node.id, node);
    }
    nodesMapReference.current = nodesMap;
    setInternalNodes(initialNodes);
  }, [initialNodes]);

  /**
   * Maneja cambios en los nodos (arrastrar, seleccionar, etc) - extraído a utilidades
   */
  const onNodesChange = useCallback(
    (changes) => {
      setInternalNodes((nodes) => {
        return handleNodesChange(changes, {
          nodes,
          nodesMap: nodesMapReference.current,
          setNodes,
          addToHistory,
        });
      });
    },
    [setNodes, addToHistory],
  );

  /**
   * Añade un nuevo nodo al flujo - extraído a utilidades
   */
  const addNode = useCallback(
    (nodeType, position, data = {}) => {
      let newNode;
      setInternalNodes((nodes) => {
        newNode = addFlowNode(
          { nodeType, position, data },
          {
            nodes,
            nodesMap: nodesMapReference.current,
            setNodes,
            addToHistory,
          },
        );
        return [...nodes, newNode];
      });
      return newNode;
    },
    [setNodes, addToHistory],
  );

  /**
   * Elimina un nodo del flujo - extraído a utilidades
   */
  const removeNode = useCallback(
    (nodeId) => {
      setInternalNodes((nodes) => {
        return removeFlowNode(nodeId, {
          nodes,
          nodesMap: nodesMapReference.current,
          setNodes,
          addToHistory,
        });
      });
    },
    [setNodes, addToHistory],
  );

  // Actualiza los datos de un nodo - extraído a utilidades
  const updateNodeData = useCallback(
    (nodeId, newData) => {
      setInternalNodes((nodes) => {
        return updateFlowNodeData(nodeId, newData, {
          nodes,
          nodesMap: nodesMapReference.current,
          setNodes,
        });
      });
    },
    [setNodes],
  );

  return {
    nodes: internalNodes,
    nodesMap: nodesMapReference.current,
    onNodesChange,
    addNode,
    removeNode,
    updateNodeData,
  };
};

export default useFlowNodes;

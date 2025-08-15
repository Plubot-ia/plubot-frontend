import { useState, useCallback } from 'react';

// Helpers extraídos para evitar sonarjs/no-nested-functions
const filterNodesNotInAction = (nodes, actionNodes) => {
  if (!nodes || !Array.isArray(nodes)) return [];
  if (!actionNodes || !Array.isArray(actionNodes)) return nodes;
  return nodes.filter((node) => !actionNodes.some((actionNode) => actionNode.id === node.id));
};

const filterEdgesNotInAction = (edges, actionEdges) => {
  if (!edges || !Array.isArray(edges)) return [];
  if (!actionEdges || !Array.isArray(actionEdges)) return edges;
  return edges.filter((edge) => !actionEdges.some((actionEdge) => actionEdge.id === edge.id));
};

const addNodesToExisting = (nodes, actionNodes) => {
  if (!nodes || !Array.isArray(nodes)) nodes = [];
  if (!actionNodes || !Array.isArray(actionNodes)) actionNodes = [];
  return [...nodes, ...actionNodes];
};

const addEdgesToExisting = (edges, actionEdges) => {
  if (!edges || !Array.isArray(edges)) edges = [];
  if (!actionEdges || !Array.isArray(actionEdges)) actionEdges = [];

  // Crear un Map para deduplicar por ID de arista
  const edgeMap = new Map();

  // Primero agregar las aristas existentes
  for (const edge of edges) {
    if (edge && edge.id) {
      edgeMap.set(edge.id, edge);
    }
  }

  // Luego agregar las aristas de la acción (sobrescribiendo si ya existen)
  for (const edge of actionEdges) {
    if (edge && edge.id) {
      edgeMap.set(edge.id, edge);
    }
  }

  // Retornar el array deduplicado
  return [...edgeMap.values()];
};

// Helper para restaurar posiciones de nodos
const restoreNodePositions = (nodes, actionNodes) =>
  nodes.map((node) => {
    const movedNode = actionNodes.find((movedNodeItem) => movedNodeItem.id === node.id);
    if (movedNode && movedNode.prevPosition) {
      return { ...node, position: movedNode.prevPosition };
    }
    return node;
  });

// Helper para aplicar nuevas posiciones de nodos
const applyNodePositions = (nodes, actionNodes) =>
  nodes.map((node) => {
    const movedNode = actionNodes.find((movedNodeItem) => movedNodeItem.id === node.id);
    if (movedNode && movedNode.newPosition) {
      return { ...node, position: movedNode.newPosition };
    }
    return node;
  });

// Helper: Ejecutar acción de deshacer según tipo
function _executeUndoAction(action, setNodes, setEdges) {
  switch (action.type) {
    case 'add': {
      // Eliminar nodos añadidos
      setNodes((nodes) => filterNodesNotInAction(nodes, action.nodes));
      break;
    }
    case 'remove': {
      // Restaurar nodos eliminados
      setNodes((nodes) => addNodesToExisting(nodes, action.nodes));
      break;
    }
    case 'move': {
      // Restaurar posiciones anteriores
      setNodes((nodes) => restoreNodePositions(nodes, action.nodes));
      break;
    }
    case 'addEdge': {
      // Eliminar aristas añadidas
      setEdges((edges) => filterEdgesNotInAction(edges, action.edges));
      break;
    }
    case 'removeEdge': {
      // Restaurar aristas eliminadas
      setEdges((edges) => addEdgesToExisting(edges, action.edges));
      break;
    }
    default: {
      break;
    }
  }
}

// Helper: Ejecutar acción de rehacer según tipo
function _executeRedoAction(action, setNodes, setEdges) {
  switch (action.type) {
    case 'add': {
      // Restaurar nodos añadidos
      setNodes((nodes) => addNodesToExisting(nodes, action.nodes));
      break;
    }
    case 'remove': {
      // Eliminar nodos nuevamente
      setNodes((nodes) => filterNodesNotInAction(nodes, action.nodes));
      break;
    }
    case 'move': {
      // Aplicar movimientos nuevamente
      setNodes((nodes) => applyNodePositions(nodes, action.nodes));
      break;
    }
    case 'addEdge': {
      // Añadir aristas nuevamente
      setEdges((edges) => addEdgesToExisting(edges, action.edges));
      break;
    }
    case 'removeEdge': {
      // Eliminar aristas nuevamente
      setEdges((edges) => filterEdgesNotInAction(edges, action.edges));
      break;
    }
    default: {
      break;
    }
  }
}

/**
 * Hook personalizado para gestionar el historial de acciones en el editor de flujos
 * @param {Function} setNodes - Función para actualizar nodos en el componente padre
 * @param {Function} setEdges - Función para actualizar aristas en el componente padre
 * @returns {Object} - Métodos y estado para gestionar el historial
 */
const useFlowHistory = (setNodes, setEdges) => {
  // Historial de acciones y posición actual en el historial
  const [history, setHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  // Crear las listas past y future para compatibilidad
  const past = history.slice(0, currentHistoryIndex + 1);
  const future = history.slice(currentHistoryIndex + 1);

  /**
   * Añade una acción al historial
   */
  const addToHistory = useCallback(
    (action) => {
      setHistory((previous) => {
        // Si estamos en medio del historial, eliminar las acciones futuras
        const newHistory = previous.slice(0, currentHistoryIndex + 1);
        return [...newHistory, action];
      });

      setCurrentHistoryIndex((previous) => previous + 1);
    },
    [currentHistoryIndex],
  );

  /**
   * Deshace la última acción
   */
  const undo = useCallback(() => {
    if (currentHistoryIndex < 0) return;

    // eslint-disable-next-line security/detect-object-injection -- currentHistoryIndex is controlled and validated
    const action = history[currentHistoryIndex];

    // Deshacer la acción según su tipo
    _executeUndoAction(action, setNodes, setEdges);

    setCurrentHistoryIndex((previous) => previous - 1);
  }, [history, currentHistoryIndex, setNodes, setEdges]);

  /**
   * Rehace la última acción deshecha
   */
  const redo = useCallback(() => {
    if (currentHistoryIndex >= history.length - 1) return;

    const action = history[currentHistoryIndex + 1];

    // Rehacer la acción según su tipo
    _executeRedoAction(action, setNodes, setEdges);

    setCurrentHistoryIndex((previous) => previous + 1);
  }, [history, currentHistoryIndex, setNodes, setEdges]);

  /**
   * Verifica si se puede deshacer
   */
  const canUndoValue = currentHistoryIndex >= 0;

  /**
   * Verifica si se puede rehacer
   */
  const canRedoValue = currentHistoryIndex < history.length - 1;

  return {
    addToHistory,
    undo,
    redo,
    canUndo: canUndoValue,
    canRedo: canRedoValue,
    past,
    future,
    history,
    currentHistoryIndex,
  };
};

export default useFlowHistory;

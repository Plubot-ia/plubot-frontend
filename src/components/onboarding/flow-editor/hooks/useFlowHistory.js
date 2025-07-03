import { useState, useCallback } from 'react';

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

    const action = history[currentHistoryIndex];

    // Deshacer la acción según su tipo
    switch (action.type) {
      case 'add': {
        // Eliminar nodos añadidos
        setNodes((nodes) =>
          nodes.filter(
            (node) =>
              !action.nodes.some((actionNode) => actionNode.id === node.id),
          ),
        );
        break;
      }

      case 'remove': {
        // Restaurar nodos eliminados
        setNodes((nodes) => [...nodes, ...action.nodes]);
        break;
      }

      case 'move': {
        // Restaurar posiciones anteriores
        setNodes((nodes) =>
          nodes.map((node) => {
            const movedNode = action.nodes.find((n) => n.id === node.id);
            if (movedNode && movedNode.prevPosition) {
              return { ...node, position: movedNode.prevPosition };
            }
            return node;
          }),
        );
        break;
      }

      case 'addEdge': {
        // Eliminar aristas añadidas
        setEdges((edges) =>
          edges.filter(
            (edge) =>
              !action.edges.some((actionEdge) => actionEdge.id === edge.id),
          ),
        );
        break;
      }

      case 'removeEdge': {
        // Restaurar aristas eliminadas
        setEdges((edges) => [...edges, ...action.edges]);
        break;
      }

      default: {
        break;
      }
    }

    setCurrentHistoryIndex((previous) => previous - 1);
  }, [history, currentHistoryIndex, setNodes, setEdges]);

  /**
   * Rehace la última acción deshecha
   */
  const redo = useCallback(() => {
    if (currentHistoryIndex >= history.length - 1) return;

    const action = history[currentHistoryIndex + 1];

    // Rehacer la acción según su tipo
    switch (action.type) {
      case 'add': {
        // Añadir nodos nuevamente
        setNodes((nodes) => [...nodes, ...action.nodes]);
        break;
      }

      case 'remove': {
        // Eliminar nodos nuevamente
        setNodes((nodes) =>
          nodes.filter(
            (node) =>
              !action.nodes.some((actionNode) => actionNode.id === node.id),
          ),
        );
        break;
      }

      case 'move': {
        // Aplicar movimientos nuevamente
        setNodes((nodes) =>
          nodes.map((node) => {
            const movedNode = action.nodes.find((n) => n.id === node.id);
            if (movedNode) {
              return { ...node, position: movedNode.position };
            }
            return node;
          }),
        );
        break;
      }

      case 'addEdge': {
        // Añadir aristas nuevamente
        setEdges((edges) => [...edges, ...action.edges]);
        break;
      }

      case 'removeEdge': {
        // Eliminar aristas nuevamente
        setEdges((edges) =>
          edges.filter(
            (edge) =>
              !action.edges.some((actionEdge) => actionEdge.id === edge.id),
          ),
        );
        break;
      }

      default: {
        break;
      }
    }

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

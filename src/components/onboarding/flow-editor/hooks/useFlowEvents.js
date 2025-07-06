import { useCallback, useRef } from 'react';
import { addEdge, updateEdge } from 'reactflow';

/**
 * Hook especializado para gestionar todos los eventos de interacción del canvas de React Flow.
 * Centraliza la lógica de conexión de nodos, actualización de aristas y acciones de deshacer/rehacer.
 * @param {Function} isValidConnection - Función para validar si una conexión es permitida.
 * @param {Function} setEdges - Función para actualizar el estado de las aristas.
 * @param {Function} deleteElements - Función para eliminar elementos (nodos/aristas).
 * @param {Function} takeSnapshot - Función para guardar un estado en el historial de deshacer/rehacer.
 */
export const useFlowEvents = (
  isValidConnection,
  setEdges,
  deleteElements,
  takeSnapshot,
) => {
  const edgeUpdateSuccessful = useRef(true);

  const onConnectNodes = useCallback(
    (params) => {
      if (isValidConnection(params)) {
        const newEdge = { ...params, type: 'smoothstep' };
        setEdges((eds) => addEdge(newEdge, eds));
        takeSnapshot();
      }
    },
    [isValidConnection, setEdges, takeSnapshot],
  );

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback(
    (oldEdge, newConnection) => {
      if (isValidConnection(newConnection)) {
        edgeUpdateSuccessful.current = true;
        setEdges((els) => updateEdge(oldEdge, newConnection, els));
        takeSnapshot();
      }
    },
    [isValidConnection, setEdges, takeSnapshot],
  );

  const onEdgeUpdateEnd = useCallback(
    (_, edge) => {
      if (!edgeUpdateSuccessful.current) {
        deleteElements({ edges: [edge] });
        takeSnapshot();
      }
      edgeUpdateSuccessful.current = true;
    },
    [deleteElements, takeSnapshot],
  );

  const onSelectionDragStop = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  return {
    onConnectNodes,
    onEdgeUpdateStart,
    onEdgeUpdate,
    onEdgeUpdateEnd,
    onSelectionDragStop,
  };
};

import { useState, useCallback, useEffect, useRef } from 'react';
import { applyEdgeChanges, addEdge } from 'reactflow';

import { connectionExists } from '../utils/flowEditorUtilities';
import { processEdgesFromBackend } from '../utils/handleFixer';

// Helper para crear nueva arista con configuración predeterminada
const _createNewEdge = (parameters) => {
  const sourceHandle = parameters.sourceHandle ?? 'output';
  const targetHandle = parameters.targetHandle ?? 'input';

  const newEdge = {
    ...parameters,
    id: `edge-${parameters.source}-${parameters.target}-${Date.now()}`,
    sourceHandle,
    targetHandle,
    type: 'default',
    animated: false,
    style: { stroke: '#00e0ff', strokeWidth: 2 },
    data: {
      ...parameters.data,
      isEnergyHose: true,
      flowSpeed: 0.5,
      flowColor: '#00e0ff',
    },
    sourceOriginal: parameters.source,
    targetOriginal: parameters.target,
  };

  return newEdge;
};

// Helper para notificar actualizaciones de aristas
const _notifyEdgeUpdate = (edgeId, delay = 50) => {
  setTimeout(() => {
    document.dispatchEvent(
      new CustomEvent('elite-edge-update-required', {
        detail: { id: edgeId },
      }),
    );
  }, delay);
};

// Helper para actualizar aristas con notificación
const _updateEdgesWithNotification = (newEdges, setEdges, edgeId) => {
  setTimeout(() => {
    setEdges(newEdges);
    if (edgeId) {
      _notifyEdgeUpdate(edgeId);
    }
  }, 0);
};

// Helper para procesar cambios de aristas
const _processEdgeChanges = (changes, options) => {
  const { newEdges, edgesMap, addToHistory } = options;
  for (const change of changes) {
    if (change.type === 'remove') {
      const removedEdge = edgesMap.get(change.id);
      edgesMap.delete(change.id);
      if (removedEdge) {
        addToHistory({
          type: 'removeEdge',
          edges: [removedEdge],
        });
      }
    } else {
      const updatedEdge = newEdges.find((edge) => edge.id === change.id);
      if (updatedEdge) {
        edgesMap.set(change.id, updatedEdge);
      }
    }
  }
};

// Helper para remover aristas conectadas a un nodo
const _removeEdgesConnectedToNode = (edges, nodeId, options) => {
  const { edgesMap, setEdges, addToHistory } = options;
  const edgesToRemove = edges.filter((edge) => edge.source === nodeId || edge.target === nodeId);

  if (edgesToRemove.length === 0) return edges;

  const newEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);

  for (const edgeToRemove of edgesToRemove) {
    edgesMap.delete(edgeToRemove.id);
  }

  setTimeout(() => setEdges(newEdges), 0);

  addToHistory({
    type: 'removeEdge',
    edges: edgesToRemove,
  });

  return newEdges;
};

/**
 * Hook personalizado para la gestión de aristas en el editor de flujos
 * @param {Array} initialEdges - Aristas iniciales
 * @param {Function} setEdges - Función para actualizar aristas en el componente padre
 * @param {Function} addToHistory - Función para añadir cambios al historial
 * @returns {Object} - Métodos y estado para gestionar aristas
 */
const useFlowEdges = (initialEdges, setEdges, addToHistory) => {
  const [internalEdges, setInternalEdges] = useState(initialEdges ?? []);
  const edgesMapReference = useRef(new Map());

  const initEdges = useCallback((edgesToInit) => {
    if (!edgesToInit || !Array.isArray(edgesToInit)) {
      setInternalEdges([]);
      return;
    }
    const processedEdges = processEdgesFromBackend(edgesToInit);

    // DEBUG: Log aristas de MessageNode al inicializar
    const messageNodeEdges = processedEdges.filter(
      (edge) => edge.sourceHandle === 'output' || edge.targetHandle === 'input',
    );
    if (messageNodeEdges.length > 0) {
      // MessageNode edges found
    }

    setInternalEdges(processedEdges);
  }, []);

  useEffect(() => {
    initEdges(initialEdges);
  }, [initialEdges, initEdges]);

  const onEdgesChange = useCallback(
    (changes) => {
      setInternalEdges((edges) => {
        const newEdges = applyEdgeChanges(changes, edges);
        const edgesMap = edgesMapReference.current;

        _processEdgeChanges(changes, { newEdges, edgesMap, addToHistory });

        setTimeout(() => setEdges(newEdges), 0);
        return newEdges;
      });
    },
    [setEdges, addToHistory],
  );

  const onConnect = useCallback(
    (parameters) => {
      if (connectionExists(internalEdges, parameters)) {
        return;
      }

      if (!parameters.source || !parameters.target) {
        return;
      }

      const newEdge = _createNewEdge(parameters);

      setInternalEdges((edges) => {
        const newEdges = addEdge(newEdge, edges);

        edgesMapReference.current.set(newEdge.id, newEdge);
        addToHistory({ edges: newEdges });

        _updateEdgesWithNotification(newEdges, setEdges, newEdge.id);

        return newEdges;
      });
    },
    [internalEdges, setEdges, addToHistory],
  );

  const removeConnectedEdges = useCallback(
    (nodeId) => {
      setInternalEdges((edges) =>
        _removeEdgesConnectedToNode(edges, nodeId, {
          edgesMap: edgesMapReference.current,
          setEdges,
          addToHistory,
        }),
      );
    },
    [setEdges, addToHistory],
  );

  return {
    edges: internalEdges,
    edgesMap: edgesMapReference.current,
    onEdgesChange,
    onConnect,
    removeConnectedEdges,
  };
};

export default useFlowEdges;

import { useState, useCallback, useEffect, useRef } from 'react';
import { applyEdgeChanges, addEdge } from 'reactflow';

import { connectionExists } from '../utils/flowEditorUtils';
import { processEdgesFromBackend } from '../utils/handleFixer';

/**
 * Hook personalizado para la gestión de aristas en el editor de flujos
 * @param {Array} initialEdges - Aristas iniciales
 * @param {Function} setEdges - Función para actualizar aristas en el componente padre
 * @param {Function} addToHistory - Función para añadir cambios al historial
 * @returns {Object} - Métodos y estado para gestionar aristas
 */
const useFlowEdges = (initialEdges, setEdges, addToHistory) => {
  const [internalEdges, setInternalEdges] = useState(initialEdges || []);
  const edgesMapReference = useRef(new Map());

  const initEdges = useCallback((edgesToInit) => {
    if (!edgesToInit || !Array.isArray(edgesToInit)) {
      setInternalEdges([]);
      return;
    }
    const processedEdges = processEdgesFromBackend(edgesToInit);
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

      const sourceHandle = parameters.sourceHandle || 'output';
      const targetHandle = parameters.targetHandle || 'input';

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

      setInternalEdges((edges) => {
        const newEdges = addEdge(newEdge, edges);
        edgesMapReference.current.set(newEdge.id, newEdge);
        addToHistory({ edges: newEdges });

        setTimeout(() => {
          setEdges(newEdges);
          setTimeout(() => {
            document.dispatchEvent(
              new CustomEvent('elite-edge-update-required', {
                detail: { id: newEdge.id },
              }),
            );
          }, 50);
        }, 0);

        return newEdges;
      });
    },
    [internalEdges, setEdges, addToHistory],
  );

  const removeConnectedEdges = useCallback(
    (nodeId) => {
      setInternalEdges((edges) => {
        const edgesToRemove = edges.filter(
          (edge) => edge.source === nodeId || edge.target === nodeId,
        );

        if (edgesToRemove.length === 0) return edges;

        const newEdges = edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId,
        );

        for (const edgeToRemove of edgesToRemove) {
          edgesMapReference.current.delete(edgeToRemove.id);
        }

        setTimeout(() => setEdges(newEdges), 0);

        addToHistory({
          type: 'removeEdge',
          edges: edgesToRemove,
        });

        return newEdges;
      });
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

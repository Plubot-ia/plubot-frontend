import { useCallback } from 'react';

import useFlowStore from '@/stores/use-flow-store';
import { NODE_LABELS } from '@/utils/node-config.js';

import { applyNodeVisibilityFix } from '../utils/optimized-flow-fixes';

/**
 * Hook para gestionar la manipulación de nodos y aristas en el editor de flujos.
 * Encapsula la lógica para añadir, eliminar, duplicar nodos, y eliminar/actualizar aristas.
 */
const useFlowElementsManager = (saveHistoryState, setHasChanges) => {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onConnect: onConnectZustand,
  } = useFlowStore((state) => ({
    nodes: state.nodes,
    edges: state.edges,
    setNodes: state.setNodes,
    setEdges: state.setEdges,
    onConnect: state.onConnect,
  }));

  const addNodeToFlow = useCallback(
    (nodeType, position) => {
      if (!nodeType) {
        return;
      }
      if (
        !position ||
        typeof position.x !== 'number' ||
        typeof position.y !== 'number'
      ) {
        position = { x: 100, y: 100 }; // Posición por defecto
      }

      saveHistoryState(nodes, edges);
      const nodeId = `${nodeType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const nodeData = {
        id: nodeId,
        label:
          NODE_LABELS && NODE_LABELS[nodeType]
            ? NODE_LABELS[nodeType]
            : `Nuevo ${nodeType}`,
      };

      switch (nodeType) {
        case 'message': {
          nodeData.message = 'Escribe tu mensaje aquí';
          break;
        }
        case 'decision': {
          nodeData.question = '¿Qué decisión quieres tomar?';
          nodeData.conditions = [
            { id: `cond-${nodeId}-default-yes`, text: 'Sí' },
            { id: `cond-${nodeId}-default-no`, text: 'No' },
          ];
          nodeData.handleIds = ['output-0', 'output-1'];
          break;
        }
        case 'option': {
          nodeData.condition = 'Condición';
          break;
        }
        case 'action': {
          nodeData.description = 'Descripción de la acción';
          break;
        }
        case 'end': {
          nodeData.endMessage = 'Fin de la conversación';
          break;
        }
        case 'start': {
          nodeData.startMessage = 'Inicio de la conversación';
          break;
        }
        default: {
          break;
        }
      }

      const newNode = {
        id: nodeId,
        type: nodeType,
        position: {
          x: Math.round(position.x),
          y: Math.round(position.y),
        },
        data: nodeData,
        draggable: true,
        selectable: true,
        connectable: true,
        style: { opacity: 1, visibility: 'visible' },
        hidden: false,
      };

      try {
        const currentNodes = useFlowStore.getState().nodes || [];
        setNodes([...currentNodes, newNode]);
        setHasChanges(true);
        setTimeout(() => {
          try {
            applyNodeVisibilityFix();
            for (const node of document.querySelectorAll('.react-flow__node')) {
              node.style.opacity = '1';
              node.style.visibility = 'visible';
              node.style.display = 'block';
            }
          } catch {}
        }, 100);
      } catch {}
      return newNode;
    },
    [nodes, edges, setNodes, saveHistoryState, setHasChanges],
  );

  const deleteNode = useCallback(
    (nodeId) => {
      if (!nodeId) return;
      saveHistoryState(nodes, edges);
      const newNodes = nodes.filter((node) => node.id !== nodeId);
      setNodes(newNodes);
      const newEdges = edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      );
      setEdges(newEdges);
      setHasChanges(true);
    },
    [nodes, edges, setNodes, setEdges, saveHistoryState, setHasChanges],
  );

  const duplicateNode = useCallback(
    (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      saveHistoryState(nodes, edges);
      const newNode = {
        ...node,
        id: `${node.type}-${Date.now()}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
      };
      setNodes([...nodes, newNode]);
      setHasChanges(true);
      return newNode;
    },
    [nodes, edges, setNodes, saveHistoryState, setHasChanges],
  );

  const deleteEdge = useCallback(
    (edgeId) => {
      if (!edgeId) return;
      saveHistoryState(nodes, edges);
      const newEdges = edges.filter((edge) => edge.id !== edgeId);
      setEdges(newEdges);
      setHasChanges(true);
    },
    [nodes, edges, setEdges, saveHistoryState, setHasChanges],
  );

  const updateEdgeData = useCallback(
    (edgeId, newData) => {
      if (!edgeId) return;
      saveHistoryState(nodes, edges);
      const newEdges = edges.map((edge) => {
        if (edge.id === edgeId) {
          return { ...edge, data: { ...edge.data, ...newData } };
        }
        return edge;
      });
      setEdges(newEdges);
      setHasChanges(true);
    },
    [nodes, edges, setEdges, saveHistoryState, setHasChanges],
  );

  const onConnectNodes = useCallback(
    (parameters) => {
      saveHistoryState(nodes, edges);
      onConnectZustand(parameters);
      setHasChanges(true);
    },
    [nodes, edges, onConnectZustand, saveHistoryState, setHasChanges],
  );

  return {
    addNodeToFlow,
    deleteNode,
    duplicateNode,
    deleteEdge,
    updateEdgeData,
    onConnectNodes,
  };
};

export default useFlowElementsManager;

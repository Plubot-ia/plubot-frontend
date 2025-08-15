import { useCallback } from 'react';

import useFlowStore from '@/stores/use-flow-store';
import { NODE_LABELS } from '@/utils/node-config.js';

// Helper: Validar y normalizar posición
const validateAndNormalizePosition = (position) => {
  if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
    return { x: 100, y: 100 }; // Posición por defecto
  }
  return position;
};

// Helper: Generar ID único para nodo
const generateNodeId = (nodeType) => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${nodeType}-${crypto.randomUUID()}`;
  }
  // Fallback determinístico para entornos sin crypto.randomUUID
  return `${nodeType}-${Date.now()}-${Date.now() % 1000}`;
};

// Helper: Crear datos específicos del tipo de nodo
const createNodeTypeData = (nodeType, nodeId) => {
  const baseData = {
    id: nodeId,
    label: (() => {
      if (NODE_LABELS && Object.prototype.hasOwnProperty.call(NODE_LABELS, nodeType)) {
        // Acceso seguro para evitar Generic Object Injection Sink
        const safeValue = Object.prototype.hasOwnProperty.call(NODE_LABELS, nodeType)
          ? Object.getOwnPropertyDescriptor(NODE_LABELS, nodeType)?.value
          : undefined;
        return safeValue || `Nuevo ${String(nodeType).replaceAll(/[^a-zA-Z0-9]/g, '')}`; // Sanitized
      }
      return `Nuevo ${nodeType}`;
    })(),
  };

  switch (nodeType) {
    case 'message': {
      return { ...baseData, message: 'Escribe tu mensaje aquí' };
    }
    case 'decision': {
      return {
        ...baseData,
        question: '¿Qué decisión quieres tomar?',
        conditions: [
          { id: `cond-${nodeId}-default-yes`, text: 'Sí' },
          { id: `cond-${nodeId}-default-no`, text: 'No' },
        ],
        handleIds: ['output-0', 'output-1'],
      };
    }
    case 'option': {
      return { ...baseData, condition: 'Condición' };
    }
    case 'action': {
      return { ...baseData, description: 'Descripción de la acción' };
    }
    case 'end': {
      return { ...baseData, endMessage: 'Fin de la conversación' };
    }
    case 'start': {
      return { ...baseData, startMessage: 'Inicio de la conversación' };
    }
    default: {
      return baseData;
    }
  }
};

import { applyNodeVisibilityFix } from '../utils/optimized-flow-fixes';

// Helper: Crear nuevo nodo con posición y datos
const createNewNode = (nodeType, position, nodeId, nodeData) => {
  const normalizedPosition = validateAndNormalizePosition(position);

  return {
    id: nodeId,
    type: nodeType,
    position: {
      x: Math.round(normalizedPosition.x),
      y: Math.round(normalizedPosition.y),
    },
    data: nodeData,
    draggable: true,
    selectable: true,
    connectable: true,
    style: { opacity: 1, visibility: 'visible' },
    hidden: false,
  };
};

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

      saveHistoryState(nodes, edges);

      const nodeId = generateNodeId(nodeType);
      const nodeData = createNodeTypeData(nodeType, nodeId);
      const newNode = createNewNode(nodeType, position, nodeId, nodeData);

      try {
        const currentNodes = useFlowStore.getState().nodes ?? [];
        setNodes([...currentNodes, newNode]);
        setHasChanges(true);
        setTimeout(() => {
          applyNodeVisibilityFix();
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
      const newEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
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

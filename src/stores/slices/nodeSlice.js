import isEqual from 'fast-deep-equal';
import { applyNodeChanges } from 'reactflow';

import { preventNodeStacking } from '@/components/onboarding/flow-editor/utils/fix-node-positions';
import { validateNodePositions } from '@/components/onboarding/flow-editor/utils/node-position-validator';
import { generateId } from '@/services/flowService';
import { NODE_LABELS, NODE_TYPES } from '@/utils/node-config';
import { createSanitizedObject } from '@/utils/object-sanitizer';

import { createDecisionNodeSlice } from './decisionNodeSlice';

// Aunque no se use para iterar, se mantiene como referencia de las propiedades permitidas.
const ALLOWED_NODE_DATA_PROPERTIES = [
  'label',
  'nodeType',
  'metadata',
  'message',
  'variables',
  'isEditing',
  'id',
  // Decision Node specific
  'conditions',
  'question',
  // Option Node specific
  'sourceNode',
  'conditionId',
  'text',
  'instruction',
  'isUltraPerformanceMode',
  'parentNode',
  'color',
  'lastUpdated',
  // AI Node specific
  'prompt',
  'promptTemplate',
  'temperature',
  'maxTokens',
  'systemMessage',
  'lastResponse',
  'lastPrompt',
  // MediaNode specific
  'type',
  'url',
  'caption',
  'altText',
  'description',
  'config',
  // WaitNode specific
  'duration',
  'unit',
  'description',
  'isCollapsed',
];

// Helper: Agregar nodo al store
function _addNodeHelper(params, get, set) {
  const { nodeData, position, userData } = params;
  const { _createNodeFromPalette, nodes } = get();
  let newNode;

  if (typeof nodeData === 'string') {
    newNode = _createNodeFromPalette(nodeData, position, userData);
  } else {
    const finalUserData = { ...nodeData.data, ...userData };
    newNode = {
      ...nodeData,
      id: nodeData.id || generateId(nodeData.type || 'default'),
      data: createSanitizedObject(finalUserData, ALLOWED_NODE_DATA_PROPERTIES),
    };
    const newNodes = [...nodes, newNode];

    // Actualizar contador al agregar nodo
    set({ nodeCount: newNodes.length });

    get()._createHistoryEntry({ nodes: newNodes });
  }
  return newNode;
}

// Helper: Actualizar nodo en el store
function _updateNodeHelper(id, dataToUpdate, get) {
  const { nodes, _createHistoryEntry } = get();
  const newNodes = nodes.map((node) => {
    if (node.id === id) {
      const sanitizedData = createSanitizedObject(dataToUpdate, ALLOWED_NODE_DATA_PROPERTIES);
      const updatedData = { ...node.data, ...sanitizedData };
      return { ...node, data: updatedData };
    }
    return node;
  });

  if (!isEqual(nodes, newNodes)) {
    _createHistoryEntry({ nodes: newNodes });
  }
}

// Helper: Duplicar nodo existente
function _duplicateNodeHelper(nodeIdToDuplicate, get) {
  const { nodes, addNode } = get();
  const nodeToDuplicate = nodes.find((n) => n.id === nodeIdToDuplicate);
  if (!nodeToDuplicate) return;

  const newNodePosition = {
    x: nodeToDuplicate.position.x + 50,
    y: nodeToDuplicate.position.y + 50,
  };

  const newLabel = `${nodeToDuplicate.data.label || 'Nodo'} (Copia)`;
  const newId = generateId(nodeToDuplicate.type);

  const newNodeData = {
    ...nodeToDuplicate,
    id: newId,
    position: newNodePosition,
    data: { ...nodeToDuplicate.data, label: newLabel },
  };
  addNode(newNodeData);
}

// Helper: Procesar eliminación de OptionNode y su condición asociada
function _processOptionNodeDeletion(nodeToDelete, deleteDecisionNodeCondition) {
  if (
    nodeToDelete?.type === 'option' &&
    nodeToDelete.data?.sourceNode &&
    nodeToDelete.data?.conditionId
  ) {
    // OptionNode deleted - removing corresponding condition from DecisionNode
    try {
      deleteDecisionNodeCondition(nodeToDelete.data.sourceNode, nodeToDelete.data.conditionId);
    } catch {
      // Error handled silently
    }
  }
}

// Helper: Recopilar nodos y aristas para eliminación en cascada
function _collectNodesToDelete(nodeIdToDelete, edges) {
  const nodesToDelete = new Set();
  const edgesToDelete = new Set();
  const queue = [nodeIdToDelete];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (nodesToDelete.has(currentId)) continue;
    nodesToDelete.add(currentId);

    for (const edge of edges) {
      if (edge.source === currentId) {
        edgesToDelete.add(edge.id);
        if (!nodesToDelete.has(edge.target)) queue.push(edge.target);
      }
    }
  }

  return { nodesToDelete, edgesToDelete };
}

// Helper: Eliminar nodo y dependencias en cascada
function _deleteNodeHelper(nodeIdToDelete, get, set) {
  const { nodes, edges, _createHistoryEntry, deleteDecisionNodeCondition } = get();

  // Recopilar nodos y aristas para eliminación
  const { nodesToDelete, edgesToDelete } = _collectNodesToDelete(nodeIdToDelete, edges);

  // Procesar eliminación de condiciones de DecisionNode para OptionNodes
  for (const nodeId of nodesToDelete) {
    const nodeToDelete = nodes.find((n) => n.id === nodeId);
    _processOptionNodeDeletion(nodeToDelete, deleteDecisionNodeCondition);
  }

  const remainingNodes = nodes.filter((node) => !nodesToDelete.has(node.id));
  const remainingEdges = edges.filter((edge) => !edgesToDelete.has(edge.id));

  // Actualizar contador al eliminar nodos
  set({ nodeCount: remainingNodes.length });

  _createHistoryEntry({ nodes: remainingNodes, edges: remainingEdges });
}

export const createNodeSlice = (set, get) => ({
  // =================================================================================================
  // STATE
  // =================================================================================================
  nodes: [],
  nodeCount: 0, // Contador dedicado para evitar re-renders innecesarios

  // =================================================================================================
  // GENERIC NODE ACTIONS
  // =================================================================================================

  onNodesChange: (changes) => {
    const { nodes: currentNodes, edges: currentEdges, _createHistoryEntry } = get();

    const isSelectionChange = changes.every((c) => c.type === 'select');
    const isPositionChange = changes.some((c) => c.type === 'position');
    const isDrag = changes.some((c) => c.type === 'position' && c.dragging);

    const newNodes = applyNodeChanges(changes, currentNodes);

    // OPTIMIZACIÓN ÉLITE: No crear historial ni actualizar contador en cambios de UI
    if (isSelectionChange || isDrag) {
      set({ nodes: newNodes });
      return;
    }

    // Si es un cambio de posición (incluyendo cuando termina el drag), no actualizar contador
    if (isPositionChange) {
      set({ nodes: newNodes });
      _createHistoryEntry({
        nodes: newNodes,
        isUndoing: false,
        isRedoing: false,
      });
      return;
    }

    // Detectar si hay cambios que afecten la cantidad de nodos visibles
    const hasRemovalOrAddition = changes.some(
      (c) => c.type === 'remove' || c.type === 'add' || (c.type === 'reset' && c.item),
    );

    // Si se eliminaron nodos, también eliminar las aristas conectadas
    const removedNodeIds = changes.filter((c) => c.type === 'remove').map((c) => c.id);

    let newEdges = currentEdges;
    if (removedNodeIds.length > 0) {
      // Filtrar aristas que estén conectadas a nodos eliminados
      newEdges = currentEdges.filter(
        (edge) => !removedNodeIds.includes(edge.source) && !removedNodeIds.includes(edge.target),
      );
    }

    // Solo actualizar el contador si realmente cambia la cantidad
    if (hasRemovalOrAddition) {
      const currentNodeCount = get().nodeCount || 0;
      const currentEdgeCount = get().edgeCount || 0;

      const updateObject = {};

      if (newNodes.length !== currentNodeCount) {
        updateObject.nodeCount = newNodes.length;
      }

      if (newEdges.length !== currentEdgeCount) {
        updateObject.edgeCount = newEdges.length;
      }

      if (Object.keys(updateObject).length > 0) {
        set(updateObject);
      }
    }

    _createHistoryEntry({
      nodes: newNodes,
      edges: newEdges,
      isUndoing: false,
      isRedoing: false,
    });
  },

  setNodes: (nodes) => {
    const { nodes: currentNodes, _createHistoryEntry, edges } = get();
    const validatedNodes = validateNodePositions(nodes ?? []);
    const processedNodes = preventNodeStacking(validatedNodes);

    if (isEqual(currentNodes, processedNodes)) {
      return;
    }

    // Actualizar contador de nodos
    set({ nodeCount: processedNodes.length });

    _createHistoryEntry({ nodes: processedNodes, edges });
  },

  addNode: (nodeData, position, userData) => {
    return _addNodeHelper({ nodeData, position, userData }, get, set);
  },

  updateNode: (id, dataToUpdate) => {
    _updateNodeHelper(id, dataToUpdate, get);
  },

  updateNodeData: (id, dataToUpdate) => get().updateNode(id, dataToUpdate),

  setNodeEditing: (nodeId, isEditing) => {
    get().updateNode(nodeId, { isEditing });
  },

  duplicateNode: (nodeIdToDuplicate) => {
    _duplicateNodeHelper(nodeIdToDuplicate, get);
  },

  deleteNode: (nodeIdToDelete) => {
    _deleteNodeHelper(nodeIdToDelete, get, set);
  },

  ...createDecisionNodeSlice(set, get),

  // =================================================================================================
  // INTERNAL HELPERS
  // =================================================================================================

  _createNodeFromPalette: (nodeType, position, userData) => {
    const { nodes, _createHistoryEntry } = get();
    const nodeId = generateId(nodeType);

    // Validate nodeType against a hardcoded list of known, safe keys to prevent object injection.
    let defaultLabel = nodeType;
    if (Object.keys(NODE_LABELS).includes(nodeType)) {
      // eslint-disable-next-line security/detect-object-injection
      defaultLabel = NODE_LABELS[nodeType]; // Safe to access after validation.
    }

    const initialData = {
      id: nodeId,
      label: userData?.label || defaultLabel,
      nodeType,
      metadata: userData,
    };

    const newNode = {
      id: nodeId,
      type: nodeType,
      position: position || {
        x: 100 + (nodes.length % 3) * 200,
        y: 100 + Math.floor(nodes.length / 3) * 150,
      },
      data: createSanitizedObject(initialData, ALLOWED_NODE_DATA_PROPERTIES),
    };

    if (newNode.type === NODE_TYPES.decision) {
      get()._initializeDecisionNodeWithOptions(newNode);
    } else {
      const newNodes = [...nodes, newNode];

      // Actualizar contador al agregar nodo desde paleta
      set({ nodeCount: newNodes.length });

      _createHistoryEntry({ nodes: newNodes });
    }

    return newNode;
  },
});

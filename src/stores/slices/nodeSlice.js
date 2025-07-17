import isEqual from 'fast-deep-equal';
import { applyNodeChanges } from 'reactflow';

import { preventNodeStacking } from '@/components/onboarding/flow-editor/utils/fix-node-positions';
import { validateNodePositions } from '@/components/onboarding/flow-editor/utils/node-position-validator';
import { generateId } from '@/services/flowService';
import { NODE_LABELS, NODE_TYPES } from '@/utils/node-config';

import { createSanitizedObject } from '../../utils/object-sanitizer';

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
];

export const createNodeSlice = (set, get) => ({
  // =================================================================================================
  // STATE
  // =================================================================================================
  nodes: [],

  // =================================================================================================
  // GENERIC NODE ACTIONS
  // =================================================================================================

  onNodesChange: (changes) => {
    const { nodes: currentNodes, _createHistoryEntry } = get();

    const isSelectionChange = changes.every((c) => c.type === 'select');
    const isDrag = changes.some((c) => c.type === 'position' && c.dragging);

    const newNodes = applyNodeChanges(changes, currentNodes);

    if (isSelectionChange || isDrag) {
      set({ nodes: newNodes });
      return;
    }

    _createHistoryEntry({
      nodes: newNodes,
      isUndoing: false,
      isRedoing: false,
    });
  },

  setNodes: (nodes) => {
    const { nodes: currentNodes, _createHistoryEntry, edges } = get();
    const validatedNodes = validateNodePositions(nodes || []);
    const processedNodes = preventNodeStacking(validatedNodes);

    if (isEqual(currentNodes, processedNodes)) {
      return;
    }

    _createHistoryEntry({ nodes: processedNodes, edges });
  },

  addNode: (nodeData, position, userData) => {
    const { _createNodeFromPalette } = get();
    let newNode;

    if (typeof nodeData === 'string') {
      newNode = _createNodeFromPalette(nodeData, position, userData);
    } else {
      const finalUserData = { ...nodeData.data, ...userData };
      newNode = {
        ...nodeData,
        id: nodeData.id || generateId(nodeData.type || 'default'),
        data: createSanitizedObject(
          finalUserData,
          ALLOWED_NODE_DATA_PROPERTIES,
        ),
      };
      get()._createHistoryEntry({ nodes: [...get().nodes, newNode] });
    }
    return newNode;
  },

  updateNode: (id, dataToUpdate) => {
    const { nodes, _createHistoryEntry } = get();
    const newNodes = nodes.map((node) => {
      if (node.id === id) {
        const sanitizedData = createSanitizedObject(
          dataToUpdate,
          ALLOWED_NODE_DATA_PROPERTIES,
        );
        const updatedData = { ...node.data, ...sanitizedData };
        return { ...node, data: updatedData };
      }
      return node;
    });

    if (!isEqual(nodes, newNodes)) {
      _createHistoryEntry({ nodes: newNodes });
    }
  },

  updateNodeData: (id, dataToUpdate) => get().updateNode(id, dataToUpdate),

  setNodeEditing: (nodeId, isEditing) => {
    get().updateNode(nodeId, { isEditing });
  },

  duplicateNode: (nodeIdToDuplicate) => {
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
  },

  deleteNode: (nodeIdToDelete) => {
    const { nodes, edges, _createHistoryEntry } = get();
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

    const remainingNodes = nodes.filter((node) => !nodesToDelete.has(node.id));
    const remainingEdges = edges.filter((edge) => !edgesToDelete.has(edge.id));

    _createHistoryEntry({ nodes: remainingNodes, edges: remainingEdges });
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
      _createHistoryEntry({ nodes: [...nodes, newNode] });
    }

    return newNode;
  },
});

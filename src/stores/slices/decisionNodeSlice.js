import isEqual from 'fast-deep-equal';

import { getConnectorColor } from '@/components/onboarding/nodes/decisionnode/DecisionNode.types';
import { generateId } from '@/services/flowService';

export const createDecisionNodeSlice = (set, get) => ({
  // =================================================================================================
  // DECISION NODE ACTIONS
  // =================================================================================================

  updateDecisionNodeQuestion: (nodeId, newQuestion) =>
    get().updateNode(nodeId, { question: newQuestion }),

  addDecisionNodeCondition: (nodeId) => {
    const { nodes, _createHistoryEntry, generateOptionNodes } = get();
    const newNodes = nodes.map((node) => {
      if (node.id === nodeId && node.type === 'decision') {
        const newCondition = {
          id: generateId('condition'),
          text: 'Nueva condición',
          condition: '',
          color: getConnectorColor(
            'Nueva condición',
            node.data.conditions.length,
          ),
        };
        const updatedConditions = [...node.data.conditions, newCondition];
        return {
          ...node,
          data: { ...node.data, conditions: updatedConditions },
        };
      }
      return node;
    });

    if (!isEqual(nodes, newNodes)) {
      _createHistoryEntry({ nodes: newNodes });
      const updatedNode = newNodes.find((n) => n.id === nodeId);
      if (updatedNode) {
        generateOptionNodes(updatedNode);
      }
    }
  },

  updateDecisionNodeConditionText: (nodeId, conditionId, newText) => {
    const { nodes, _createHistoryEntry, generateOptionNodes } = get();
    const newNodes = nodes.map((node) => {
      if (node.id === nodeId && node.type === 'decision') {
        const updatedConditions = node.data.conditions.map((cond) =>
          cond.id === conditionId ? { ...cond, text: newText } : cond,
        );
        return {
          ...node,
          data: { ...node.data, conditions: updatedConditions },
        };
      }
      return node;
    });

    if (!isEqual(nodes, newNodes)) {
      _createHistoryEntry({ nodes: newNodes });
      const updatedNode = newNodes.find((n) => n.id === nodeId);
      if (updatedNode) {
        generateOptionNodes(updatedNode);
      }
    }
  },

  deleteDecisionNodeCondition: (nodeId, conditionId) => {
    const { nodes, _createHistoryEntry, generateOptionNodes } = get();
    const newNodes = nodes.map((node) => {
      if (node.id === nodeId && node.type === 'decision') {
        const updatedConditions = node.data.conditions.filter(
          (cond) => cond.id !== conditionId,
        );
        return {
          ...node,
          data: { ...node.data, conditions: updatedConditions },
        };
      }
      return node;
    });

    if (!isEqual(nodes, newNodes)) {
      _createHistoryEntry({ nodes: newNodes });
      const updatedNode = newNodes.find((n) => n.id === nodeId);
      if (updatedNode) {
        generateOptionNodes(updatedNode);
      }
    }
  },

  generateOptionNodes: (decisionNode) => {
    const { nodes, edges, _createHistoryEntry, isUltraMode } = get();

    const existingOptionNodeIds = new Set(
      edges
        .filter((edge) => edge.source === decisionNode.id)
        .map((edge) => edge.target),
    );

    const nodesWithoutOldOptions = nodes.filter(
      (node) => !existingOptionNodeIds.has(node.id),
    );
    const edgesWithoutOldOptions = edges.filter(
      (edge) => edge.source !== decisionNode.id,
    );

    const { conditions } = decisionNode.data;
    if (!conditions || conditions.length === 0) {
      _createHistoryEntry({
        nodes: nodesWithoutOldOptions,
        edges: edgesWithoutOldOptions,
      });
      return;
    }

    const isUltra = isUltraMode || decisionNode.data.isUltraPerformanceMode;

    const newOptionNodes = conditions.map((condition, index) => ({
      id: `option-${decisionNode.id}-${condition.id}`,
      type: 'option',
      position: {
        x:
          decisionNode.position.x + (index - (conditions.length - 1) / 2) * 250,
        y: decisionNode.position.y + 200,
      },
      data: {
        sourceNode: decisionNode.id,
        conditionId: condition.id,
        text: condition.text,
        instruction: condition.text,
        isUltraPerformanceMode: isUltra,
        parentNode: undefined,
        color: condition.color,
        lastUpdated: new Date().toISOString(),
      },
      draggable: true,
      deletable: true,
    }));

    const newEdges = conditions.map((condition) => ({
      id: `edge-${decisionNode.id}-${condition.id}`,
      source: decisionNode.id,
      target: `option-${decisionNode.id}-${condition.id}`,
      sourceHandle: `output-${condition.id}`,
      targetHandle: 'target',
      type: 'eliteEdge',
      animated: !isUltra,
      style: { stroke: condition.color, strokeWidth: 2 },
    }));

    _createHistoryEntry({
      nodes: [...nodesWithoutOldOptions, ...newOptionNodes],
      edges: [...edgesWithoutOldOptions, ...newEdges],
    });
  },

  _initializeDecisionNodeWithOptions: (decisionNode) => {
    const { generateOptionNodes } = get();

    if (
      !Array.isArray(decisionNode.data.conditions) ||
      decisionNode.data.conditions.length === 0
    ) {
      decisionNode.data.conditions = [
        {
          id: generateId('condition'),
          text: 'Sí',
          condition: 'true',
          color: getConnectorColor('Sí', 0),
        },
        {
          id: generateId('condition'),
          text: 'No',
          condition: 'false',
          color: getConnectorColor('No', 1),
        },
      ];
    }

    generateOptionNodes(decisionNode);
  },
});

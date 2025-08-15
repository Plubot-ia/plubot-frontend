import { v4 as uuidv4 } from 'uuid';

import { NODE_LABELS, NODE_TYPES } from '@/utils/node-config.js';

export const createNodeDataObject = ({ nodeType, nodeLabel, category, powerItemData }) => {
  const nodeId = `${nodeType}-${uuidv4().slice(0, 8)}`;
  const isAdvancedAiPowerNode = powerItemData && powerItemData.id === 'advancedAiPower';
  const finalNodeType = isAdvancedAiPowerNode ? NODE_TYPES.ADVANCED_AI_NODE : nodeType;

  let finalNodeLabel;
  if (isAdvancedAiPowerNode) {
    finalNodeLabel = powerItemData.title || NODE_LABELS.ADVANCED_AI_NODE;
  } else {
    finalNodeLabel = nodeLabel;
    if (!finalNodeLabel) {
      finalNodeLabel = Object.prototype.hasOwnProperty.call(NODE_LABELS, nodeType)
        ? // The key is validated by hasOwnProperty, so this is safe.
          // eslint-disable-next-line security/detect-object-injection
          NODE_LABELS[nodeType]
        : nodeLabel;
    }
  }

  const nodeInfo = {
    id: nodeId,
    type: finalNodeType,
    label: finalNodeLabel,
    category: category || 'basic',
    data: {
      id: nodeId,
      label: finalNodeLabel,
      ...(nodeType === 'decision' ? { handleIds: ['output-0', 'output-1'] } : {}),
      ...powerItemData,
    },
    position: { x: 0, y: 0 },
    draggable: true,
    selectable: true,
  };

  if (finalNodeType === 'ai') {
    const defaultAiData = {
      promptTemplate: '',
      temperature: 0.7,
      maxTokens: 512,
      systemMessage: '',
      responseVariable: 'ai_response',
      streaming: false,
      ultraMode: false,
      isLoading: false,
      error: undefined,
      lastResponse: undefined,
      interpolatedPromptPreview: '',
    };
    nodeInfo.data = { ...defaultAiData, ...nodeInfo.data };
  }

  return nodeInfo;
};

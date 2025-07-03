import React, { Suspense } from 'react';

// Node components – same paths used elsewhere
import ActionNode from '@/components/onboarding/nodes/actionnode/ActionNode.jsx';
import AiNode from '@/components/onboarding/nodes/ainode/AiNode';
import DecisionNode from '@/components/onboarding/nodes/decisionnode/DecisionNode.jsx';
import DiscordNode from '@/components/onboarding/nodes/discordnode/DiscordNode.tsx';
import EndNode from '@/components/onboarding/nodes/endnode/EndNode';
import HttpRequestNode from '@/components/onboarding/nodes/httprequestnode/HttpRequestNode.jsx';
import MessageNode from '@/components/onboarding/nodes/messagenode/MessageNode.jsx';
import OptionNode from '@/components/onboarding/nodes/optionnode/OptionNode.jsx';
import PowerNode from '@/components/onboarding/nodes/powernode/PowerNode.jsx';
import StartNode from '@/components/onboarding/nodes/startnode/StartNode';
import useFlowStore from '@/stores/use-flow-store';

import EmotionDetectionNode from '@/components/onboarding/nodes/emotiondetectionnode';

/**
 * Crea el objeto nodeTypes reutilizable para ReactFlow.
 * @param {Object} nodeStyles - Estilos obtenidos desde useNodeStyles
 * @param {boolean} isUltraPerformanceMode - Flag de modo ultra
 * @returns {Object} nodeTypes
 */
export const createNodeTypes = (nodeStyles, isUltraPerformanceMode = false) => {
  const storeState = useFlowStore.getState();
  const { onNodesChange, setNodes, setEdges } = storeState;

  const withCommonProperties = (Component) => {
    const WrappedComponent = (properties) => (
      <Suspense fallback={<div>Loading...</div>}>
        <Component
          {...properties}
          styles={nodeStyles}
          onNodesChange={onNodesChange}
          setNodes={setNodes}
          setEdges={setEdges}
          isUltraPerformanceMode={isUltraPerformanceMode}
        />
      </Suspense>
    );

    WrappedComponent.displayName = `WithCommonProperties(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
  };

  return {
    start: withCommonProperties(StartNode),
    end: withCommonProperties(EndNode),
    message: withCommonProperties(MessageNode),
    decision: withCommonProperties(DecisionNode),
    action: withCommonProperties(ActionNode),
    option: withCommonProperties(OptionNode),
    httpRequest: withCommonProperties(HttpRequestNode),
    power: withCommonProperties(PowerNode),
    discord: withCommonProperties(DiscordNode),
    ai: withCommonProperties(AiNode),
    emotionDetection: withCommonProperties(EmotionDetectionNode),
  };
};

export * from './nodeRegistry.jsx';

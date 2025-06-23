import React, { Suspense } from 'react';
import useFlowStore from '@/stores/useFlowStore';

// Node components – same paths used elsewhere
import StartNode from '@/components/onboarding/nodes/startnode/StartNode';
import EndNode from '@/components/onboarding/nodes/endnode/EndNode';
import MessageNode from '@/components/onboarding/nodes/messagenode/MessageNode.jsx';
import DecisionNode from '@/components/onboarding/nodes/decisionnode/DecisionNode.jsx';
import ActionNode from '@/components/onboarding/nodes/actionnode/ActionNode.jsx';
import OptionNode from '@/components/onboarding/nodes/optionnode/OptionNode.jsx';
import HttpRequestNode from '@/components/onboarding/nodes/httprequestnode/HttpRequestNode.jsx';
import PowerNode from '@/components/onboarding/nodes/powernode/PowerNode.jsx';
import DiscordNode from '@/components/onboarding/nodes/discordnode/DiscordNode.tsx';
import AiNode from '@/components/onboarding/nodes/ainode/AiNode';
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

  const withCommonProps = (Component) => (props) => (
    <Suspense fallback={<div>Loading...</div>}>
      <Component
        {...props}
        styles={nodeStyles}
        onNodesChange={onNodesChange}
        setNodes={setNodes}
        setEdges={setEdges}
        isUltraPerformanceMode={isUltraPerformanceMode}
      />
    </Suspense>
  );

  return {
    start: withCommonProps(StartNode),
    end: withCommonProps(EndNode),
    message: withCommonProps(MessageNode),
    decision: withCommonProps(DecisionNode),
    action: withCommonProps(ActionNode),
    option: withCommonProps(OptionNode),
    httpRequest: withCommonProps(HttpRequestNode),
    power: withCommonProps(PowerNode),
    discord: withCommonProps(DiscordNode),
    ai: withCommonProps(AiNode),
    emotionDetection: withCommonProps(EmotionDetectionNode),
  };
};

export * from './nodeRegistry.jsx';

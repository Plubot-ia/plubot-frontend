import React, { Suspense } from 'react';

// --- Global LOD System ---
import GenericCompactNode from '@/components/onboarding/flow-editor/lod/GenericCompactNode';
import GenericMiniNode from '@/components/onboarding/flow-editor/lod/GenericMiniNode';
import GlobalLODNode from '@/components/onboarding/flow-editor/lod/GlobalLODNode';
import EliteEdge from '@/components/onboarding/flow-editor/ui/EliteEdge.jsx';
// --- Full Detail Node Components (LOD 0) ---
import ActionNode from '@/components/onboarding/nodes/actionnode/ActionNode.jsx';
import AiNode from '@/components/onboarding/nodes/ainode/AiNode';
import AiNodePro from '@/components/onboarding/nodes/ainodepro';
import DecisionNode from '@/components/onboarding/nodes/decisionnode/DecisionNode.jsx';
import DiscordNode from '@/components/onboarding/nodes/discordnode/DiscordNode.tsx';
import EmotionDetectionNode from '@/components/onboarding/nodes/emotiondetectionnode';
import EndNode from '@/components/onboarding/nodes/endnode/EndNode';
import HttpRequestNode from '@/components/onboarding/nodes/httprequestnode/HttpRequestNode.jsx';
import OptionNode from '@/components/onboarding/nodes/optionnode/OptionNode.jsx';
import PowerNode from '@/components/onboarding/nodes/powernode/PowerNode.jsx';
import StartNode from '@/components/onboarding/nodes/startnode/StartNode';

// --- Message Node Specific LOD Components ---
const MessageNode = React.lazy(
  () => import('@/components/onboarding/nodes/messagenode/MessageNode'),
);
const CompactMessageNode = React.lazy(
  () => import('@/components/onboarding/nodes/messagenode/CompactMessageNode'),
);
const MiniMessageNode = React.lazy(
  () => import('@/components/onboarding/nodes/messagenode/MiniMessageNode'),
);

/**
 * HOC to wrap a node component with common props and Suspense for lazy loading.
 */
const withSharedInfrastructure = (Component, storeFunctions) => {
  const WrappedComponent = (properties) => (
    <Suspense fallback={<div>Loading...</div>}>
      <Component {...properties} {...storeFunctions} />
    </Suspense>
  );
  WrappedComponent.displayName = `WithSharedInfrastructure(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
};

// Define the full suite of nodes with their respective LOD levels.
const NODE_DEFINITIONS = {
  start: {
    Full: StartNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  end: {
    Full: EndNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  message: {
    Full: MessageNode,
    Compact: CompactMessageNode, // Specific implementation
    Mini: MiniMessageNode, // Specific implementation
  },
  decision: {
    Full: DecisionNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  action: {
    Full: ActionNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  option: {
    Full: OptionNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  httpRequest: {
    Full: HttpRequestNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  power: {
    Full: PowerNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  discord: {
    Full: DiscordNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  ai: {
    Full: AiNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  emotionDetection: {
    Full: EmotionDetectionNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  aiNodePro: {
    Full: AiNodePro,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
};

/**
 * Factory function to create the nodeTypes object for ReactFlow.
 * This now implements the global LOD system.
 * @param {boolean} isUltraPerformanceMode - Flag for ultra performance mode.
 * @returns {Object} nodeTypes object for ReactFlow.
 */
export const createNodeTypes = (
  isUltraPerformanceMode = false,
  storeFunctions = {},
) => {
  // The LOD orchestrator, pre-configured with common props.
  const LODWrapper = (FullNode, CompactNode, MiniNode) => {
    const WrappedLODComponent = (properties) => {
      // Inject nodeType into the data payload for our generic components.
      // React Flow provides the node's registered type in `props.type`.
      const augmentedProperties = {
        ...properties,
        data: {
          ...properties.data,
          nodeType: properties.type,
        },
      };

      return (
        <GlobalLODNode
          FullNode={FullNode}
          CompactNode={CompactNode}
          MiniNode={MiniNode}
          {...augmentedProperties} // Pass augmented props down
          {...storeFunctions} // Pass all store functions down
          isUltraPerformanceMode={isUltraPerformanceMode}
        />
      );
    };

    WrappedLODComponent.displayName = `LODWrapper(${FullNode.displayName || FullNode.name || 'FullNode'})`;
    return WrappedLODComponent;
  };

  // Build the final nodeTypes object by applying the wrappers.
  const nodeTypes = {};
  for (const [name, { Full, Compact, Mini }] of Object.entries(
    NODE_DEFINITIONS,
  )) {
    // Acceso seguro usando Object.prototype.hasOwnProperty para evitar prototype pollution
    if (Object.prototype.hasOwnProperty.call(nodeTypes, name) || name) {
      // Usar Object.defineProperty para acceso controlado y seguro
      Object.defineProperty(nodeTypes, name, {
        value: withSharedInfrastructure(
          LODWrapper(Full, Compact, Mini),
          storeFunctions,
        ),
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }
  return nodeTypes;
};

// Edge types remain unchanged
export const edgeTypes = {
  default: (properties) => <EliteEdge {...properties} variant='default' />,
  elite: (properties) => <EliteEdge {...properties} variant='default' />,
  eliteEdge: (properties) => <EliteEdge {...properties} variant='default' />,
  'elite-edge': (properties) => <EliteEdge {...properties} variant='default' />,
  'success-edge': (properties) => (
    <EliteEdge {...properties} variant='success' />
  ),
  'warning-edge': (properties) => (
    <EliteEdge {...properties} variant='warning' />
  ),
  'error-edge': (properties) => <EliteEdge {...properties} variant='error' />,
  'custom-edge': (properties) => <EliteEdge {...properties} variant='custom' />,
};

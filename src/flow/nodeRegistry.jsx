import React, { Suspense, memo, useMemo } from 'react';

// --- Global LOD System ---
import GenericCompactNode from '@/components/onboarding/flow-editor/lod/GenericCompactNode';
import GenericMiniNode from '@/components/onboarding/flow-editor/lod/GenericMiniNode';
import GlobalLODNode from '@/components/onboarding/flow-editor/lod/GlobalLODNode';
// CRITICAL: EliteEdge directo - el wrapper causaba renders dobles
import EliteEdge from '@/components/onboarding/flow-editor/ui/EliteEdge.jsx';
// --- Full Detail Node Components (LOD 0) ---
import ActionNode from '@/components/onboarding/nodes/actionnode/ActionNode.jsx';
import AiNode from '@/components/onboarding/nodes/ainode/AiNode';
import AiNodePro from '@/components/onboarding/nodes/ainodepro';
import ApiNode from '@/components/onboarding/nodes/apinode/ApiNode';
import ConditionNode from '@/components/onboarding/nodes/conditionnode/ConditionNode';
import DecisionNode from '@/components/onboarding/nodes/decisionnode/DecisionNode.tsx';
import DiscordNode from '@/components/onboarding/nodes/discordnode/DiscordNode.tsx';
import EmotionDetectionNode from '@/components/onboarding/nodes/emotiondetectionnode';
import EndNode from '@/components/onboarding/nodes/endnode/EndNode';
import HttpRequestNode from '@/components/onboarding/nodes/httprequestnode/HttpRequestNode.jsx';
import InputNode from '@/components/onboarding/nodes/inputnode/InputNode';
import MediaNode from '@/components/onboarding/nodes/medianode/MediaNode';
import MemoryNode from '@/components/onboarding/nodes/memorynode/MemoryNode';
import MessageNode from '@/components/onboarding/nodes/messagenode/MessageNode';
import OptionNode from '@/components/onboarding/nodes/optionnode';
import PowerNode from '@/components/onboarding/nodes/powernode/PowerNode.jsx';
import WaitNode from '@/components/onboarding/nodes/waitnode/WaitNode';

import StartNode from '../components/onboarding/nodes/startnode/StartNode';

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
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  decision: {
    Full: DecisionNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  condition: {
    Full: ConditionNode,
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
  httpRequestNode: {
    Full: HttpRequestNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  input: {
    Full: InputNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  powerNode: {
    Full: PowerNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  discord: {
    Full: DiscordNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  apinode: {
    Full: ApiNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  waitnode: {
    Full: WaitNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  medianode: {
    Full: MediaNode,
    Compact: GenericCompactNode,
    Mini: GenericMiniNode,
  },
  memorynode: {
    Full: MemoryNode,
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
 * Create stable memoized LOD wrapper components for each node type.
 * These are created once and reused to prevent unnecessary unmount/remount.
 */
const createStableLODWrapper = (FullNode, CompactNode, MiniNode, nodeName) => {
  const StableLODWrapper = memo((properties) => {
    // Inject nodeType into the data payload for our generic components.
    // React Flow provides the node's registered type in `props.type`.
    const augmentedProperties = useMemo(
      () => ({
        ...properties,
        data: {
          ...properties.data,
          nodeType: properties.type,
        },
      }),
      [properties],
    );

    return (
      <GlobalLODNode
        FullNode={FullNode}
        CompactNode={CompactNode}
        MiniNode={MiniNode}
        {...augmentedProperties}
        isUltraPerformanceMode={false} // This will be overridden by props if needed
      />
    );
  });

  StableLODWrapper.displayName = `StableLODWrapper(${nodeName})`;
  return StableLODWrapper;
};

/**
 * Create stable wrapper with Suspense for each node component.
 * This wrapper is created once per node type and reused.
 */
const createStableNodeWrapper = (Component, nodeName) => {
  const StableNodeWrapper = memo((properties) => (
    <Suspense fallback={<div>Loading...</div>}>
      <Component {...properties} />
    </Suspense>
  ));

  StableNodeWrapper.displayName = `StableNodeWrapper(${nodeName})`;
  return StableNodeWrapper;
};

/**
 * Pre-create all stable wrapped components.
 * These are created once at module load time and reused.
 */
const STABLE_NODE_TYPES = {};

// Create stable wrapped components for each node type
for (const [name, { Full, Compact, Mini }] of Object.entries(NODE_DEFINITIONS)) {
  const lodWrapper = createStableLODWrapper(Full, Compact, Mini, name);
  Object.assign(STABLE_NODE_TYPES, { [name]: createStableNodeWrapper(lodWrapper, name) });
}

/**
 * Factory function to create the nodeTypes object for ReactFlow.
 * This now returns the same stable components on every call to prevent unmount/remount.
 * @param {boolean} isUltraPerformanceMode - Flag for ultra performance mode (currently unused).
 * @param {Object} storeFunctions - Store functions to pass to nodes (currently unused).
 * @returns {Object} nodeTypes object for ReactFlow.
 */
export const createNodeTypes = (_isUltraPerformanceMode = false, _storeFunctions = {}) => {
  // Always return the same stable components
  // This prevents React from seeing "new" components and unmounting/remounting them
  return STABLE_NODE_TYPES;
};

// 🚀 COMPONENTES ELITE EDGE OPTIMIZADOS - MEMOIZADOS CORRECTAMENTE
// EliteEdge ya está optimizado con React.memo y comparación personalizada
// CRITICAL: NO usar useRenderTracker en wrappers - causa doble tracking y renders extras
const DefaultEliteEdge = React.memo((properties) => {
  // EliteEdge directo para evitar renders dobles del wrapper
  return <EliteEdge {...properties} variant='default' />;
});
const SuccessEliteEdge = React.memo((properties) => {
  // EliteEdge directo para evitar renders dobles del wrapper
  return <EliteEdge {...properties} variant='success' />;
});
const WarningEliteEdge = React.memo((properties) => {
  // EliteEdge directo para evitar renders dobles del wrapper
  return <EliteEdge {...properties} variant='warning' />;
});
const ErrorEliteEdge = React.memo((properties) => {
  // EliteEdge directo para evitar renders dobles del wrapper
  return <EliteEdge {...properties} variant='error' />;
});
const CustomEliteEdge = React.memo((properties) => {
  // EliteEdge directo para evitar renders dobles del wrapper
  return <EliteEdge {...properties} variant='custom' />;
});

DefaultEliteEdge.displayName = 'DefaultEliteEdge';
SuccessEliteEdge.displayName = 'SuccessEliteEdge';
WarningEliteEdge.displayName = 'WarningEliteEdge';
ErrorEliteEdge.displayName = 'ErrorEliteEdge';
CustomEliteEdge.displayName = 'CustomEliteEdge';

// 🚀 OPTIMIZACIÓN CRÍTICA: Funciones estables para edgeTypes
// ReactFlow espera funciones que devuelvan componentes, pero estas funciones
// deben ser estables para que React.memo funcione correctamente
// 🚀 EDGE TYPES OPTIMIZADOS - SIN WRAPPERS ADICIONALES
// Usar directamente los componentes memoizados para evitar recreación de funciones
export const edgeTypes = {
  default: DefaultEliteEdge,
  elite: DefaultEliteEdge,
  eliteEdge: DefaultEliteEdge,
  'elite-edge': DefaultEliteEdge,
  'success-edge': SuccessEliteEdge,
  'warning-edge': WarningEliteEdge,
  'error-edge': ErrorEliteEdge,
  'custom-edge': CustomEliteEdge,
};

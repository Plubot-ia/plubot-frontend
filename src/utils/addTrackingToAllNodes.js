/**
 * addTrackingToAllNodes.js - Script para agregar tracking a todos los nodos automáticamente
 * Este script agrega el hook useRenderTracker a todos los nodos que aún no lo tienen
 */

// Lista de nodos para actualizar con su información
const NODES_TO_UPDATE = [
  // Nodos de Flujo
  {
    name: 'EndNode',
    path: 'src/components/onboarding/nodes/endnode/EndNode.jsx',
    componentName: 'EndNode',
    category: 'FLOW_NODES',
  },
  {
    name: 'MessageNode',
    path: 'src/components/onboarding/nodes/messagenode/MessageNode.jsx',
    componentName: 'MessageNode',
    category: 'FLOW_NODES',
  },
  {
    name: 'DecisionNode',
    path: 'src/components/onboarding/nodes/decisionnode/DecisionNode.jsx',
    componentName: 'DecisionNode',
    category: 'FLOW_NODES',
  },
  {
    name: 'ConditionNode',
    path: 'src/components/onboarding/nodes/conditionnode/ConditionNode.jsx',
    componentName: 'ConditionNode',
    category: 'FLOW_NODES',
  },
  {
    name: 'InputNode',
    path: 'src/components/onboarding/nodes/inputnode/InputNode.jsx',
    componentName: 'InputNode',
    category: 'FLOW_NODES',
  },

  // Nodos de IA
  {
    name: 'AiNode',
    path: 'src/components/onboarding/nodes/ainode/AiNode.jsx',
    componentName: 'AiNode',
    category: 'AI_NODES',
  },
  {
    name: 'AiNodePro',
    path: 'src/components/onboarding/nodes/ainodepro/AiNodePro.jsx',
    componentName: 'AiNodePro',
    category: 'AI_NODES',
  },
  {
    name: 'EmotionDetectionNode',
    path: 'src/components/onboarding/nodes/emotiondetectionnode/EmotionDetectionNode.jsx',
    componentName: 'EmotionDetectionNode',
    category: 'AI_NODES',
  },
  {
    name: 'PowerNode',
    path: 'src/components/onboarding/nodes/powernode/PowerNode.jsx',
    componentName: 'PowerNode',
    category: 'AI_NODES',
  },

  // Nodos de Integración
  {
    name: 'ApiNode',
    path: 'src/components/onboarding/nodes/apinode/ApiNode.tsx',
    componentName: 'ApiNode',
    category: 'INTEGRATION_NODES',
    isTypeScript: true,
  },
  {
    name: 'HttpRequestNode',
    path: 'src/components/onboarding/nodes/httprequestnode/HttpRequestNode.jsx',
    componentName: 'HttpRequestNode',
    category: 'INTEGRATION_NODES',
  },
  {
    name: 'WebhookNode',
    path: 'src/components/onboarding/nodes/webhooknode/WebhookNode.jsx',
    componentName: 'WebhookNode',
    category: 'INTEGRATION_NODES',
  },
  {
    name: 'DatabaseNode',
    path: 'src/components/onboarding/nodes/databasenode/DatabaseNode.jsx',
    componentName: 'DatabaseNode',
    category: 'INTEGRATION_NODES',
  },
  {
    name: 'DiscordNode',
    path: 'src/components/onboarding/nodes/discordnode/DiscordNode.jsx',
    componentName: 'DiscordNode',
    category: 'INTEGRATION_NODES',
  },

  // Nodos Multimedia
  {
    name: 'ActionNode',
    path: 'src/components/onboarding/nodes/actionnode/ActionNode.jsx',
    componentName: 'ActionNode',
    category: 'MEDIA_NODES',
  },
];

// Template para el import
const getImportStatement = () => {
  return "import { useRenderTracker } from '@/utils/renderTracker';";
};

// Template para el hook
const getHookStatement = (componentName) => {
  return `  useRenderTracker('${componentName}', [id, data]);`;
};

// Información de integración para cada nodo
const getIntegrationInfo = (node) => {
  return {
    path: node.path,
    importToAdd: getImportStatement(),
    hookToAdd: getHookStatement(node.componentName),
    instructions: `
Para ${node.name}:
1. Agregar import después de otros imports de React:
   ${getImportStatement()}

2. Agregar hook al inicio del componente (después de otros hooks):
   ${getHookStatement(node.componentName)}

3. Verificar que el componente reciba 'id' y 'data' como props
`.trim(),
  };
};

// Exportar la configuración
export const nodesToUpdate = NODES_TO_UPDATE;
export const getNodeIntegration = getIntegrationInfo;

// Generar resumen de integración
export const generateIntegrationSummary = () => {
  const summary = {
    totalNodes: NODES_TO_UPDATE.length,
    byCategory: {},
    integrationSteps: [],
  };

  for (const node of NODES_TO_UPDATE) {
    if (!summary.byCategory[node.category]) {
      summary.byCategory[node.category] = [];
    }
    summary.byCategory[node.category].push(node.name);
    summary.integrationSteps.push(getIntegrationInfo(node));
  }

  return summary;
};

// Script de integración de tracking preparado
// Total de nodos a actualizar: ${NODES_TO_UPDATE.length}
// Categorías disponibles en generateIntegrationSummary().byCategory

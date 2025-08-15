/**
 * trackingIntegrationHelper.js - Helper para integrar tracking en componentes
 * Facilita la adición del hook useRenderTracker a múltiples componentes
 */

// Template de import para agregar a los componentes
export const TRACKING_IMPORT = "import { useRenderTracker } from '@/utils/renderTracker';";

// Template alternativo para el sistema mejorado
export const ENHANCED_TRACKING_IMPORT =
  "import { useEnhancedRenderTracker } from '@/utils/enhancedRenderTracker';";

// Template de uso básico del hook
export const getBasicTrackingHook = (componentName) => {
  return `  useRenderTracker('${componentName}');`;
};

// Template de uso avanzado con dependencias
export const getAdvancedTrackingHook = (componentName, dependencies = []) => {
  const deps = dependencies.length > 0 ? `[${dependencies.join(', ')}]` : '[]';
  return `  useRenderTracker('${componentName}', ${deps});`;
};

// Template de uso con el sistema mejorado
export const getEnhancedTrackingHook = (componentName, category, dependencies = []) => {
  const deps = dependencies.length > 0 ? `[${dependencies.join(', ')}]` : '[]';
  return `  useEnhancedRenderTracker('${componentName}', ${deps}, { category: '${category}' });`;
};

// Lista de componentes que necesitan tracking
export const COMPONENTS_TO_TRACK = {
  // Nodos de Flujo
  FLOW_NODES: [
    { name: 'StartNode', path: '/src/components/onboarding/nodes/startnode/StartNode.jsx' },
    { name: 'EndNode', path: '/src/components/onboarding/nodes/endnode/EndNode.jsx' },
    { name: 'MessageNode', path: '/src/components/onboarding/nodes/messagenode/MessageNode.jsx' },
    {
      name: 'DecisionNode',
      path: '/src/components/onboarding/nodes/decisionnode/DecisionNode.jsx',
    },
    {
      name: 'ConditionNode',
      path: '/src/components/onboarding/nodes/conditionnode/ConditionNode.jsx',
    },
    { name: 'InputNode', path: '/src/components/onboarding/nodes/inputnode/InputNode.jsx' },
  ],

  // Nodos de IA
  AI_NODES: [
    { name: 'AiNode', path: '/src/components/onboarding/nodes/ainode/AiNode.jsx' },
    { name: 'AiNodePro', path: '/src/components/onboarding/nodes/ainodepro/AiNodePro.jsx' },
    {
      name: 'EmotionDetectionNode',
      path: '/src/components/onboarding/nodes/emotiondetectionnode/EmotionDetectionNode.jsx',
    },
    { name: 'PowerNode', path: '/src/components/onboarding/nodes/powernode/PowerNode.jsx' },
  ],

  // Nodos de Integración
  INTEGRATION_NODES: [
    { name: 'ApiNode', path: '/src/components/onboarding/nodes/apinode/ApiNode.tsx' },
    {
      name: 'HttpRequestNode',
      path: '/src/components/onboarding/nodes/httprequestnode/HttpRequestNode.jsx',
    },
    { name: 'WebhookNode', path: '/src/components/onboarding/nodes/webhooknode/WebhookNode.jsx' },
    {
      name: 'DatabaseNode',
      path: '/src/components/onboarding/nodes/databasenode/DatabaseNode.jsx',
    },
    { name: 'DiscordNode', path: '/src/components/onboarding/nodes/discordnode/DiscordNode.jsx' },
  ],

  // Nodos Multimedia
  MEDIA_NODES: [
    { name: 'ActionNode', path: '/src/components/onboarding/nodes/actionnode/ActionNode.jsx' },
  ],

  // Componentes de UI principales
  UI_COMPONENTS: [
    {
      name: 'NodePalette',
      path: '/src/components/onboarding/flow-editor/components/NodePalette.jsx',
    },
    {
      name: 'CustomMiniMap',
      path: '/src/components/onboarding/flow-editor/components/CustomMiniMap.jsx',
    },
    {
      name: 'BackgroundScene',
      path: '/src/components/onboarding/flow-editor/components/BackgroundScene.jsx',
    },
    { name: 'FlowMain', path: '/src/components/onboarding/flow-editor/FlowMain.jsx' },
  ],

  // Edges
  EDGES: [
    { name: 'EliteEdge', path: '/src/components/onboarding/flow-editor/edges/EliteEdge.jsx' },
  ],
};

// Función para generar el código de integración
export const generateIntegrationCode = (componentName, category, useDependencies = false) => {
  const importStatement = ENHANCED_TRACKING_IMPORT;
  const hookStatement = useDependencies
    ? getEnhancedTrackingHook(componentName, category, ['id', 'data'])
    : getEnhancedTrackingHook(componentName, category);

  return {
    import: importStatement,
    hook: hookStatement,
    instructions: `
1. Agregar el import al inicio del archivo (después de otros imports):
   ${importStatement}

2. Agregar el hook al inicio del componente (después de otros hooks):
   ${hookStatement}
    `.trim(),
  };
};

// Exportar configuración para uso en otros scripts
const trackingIntegrationConfig = {
  TRACKING_IMPORT,
  ENHANCED_TRACKING_IMPORT,
  getBasicTrackingHook,
  getAdvancedTrackingHook,
  getEnhancedTrackingHook,
  COMPONENTS_TO_TRACK,
  generateIntegrationCode,
};

export default trackingIntegrationConfig;

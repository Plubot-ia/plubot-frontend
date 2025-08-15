import {
  renderStartNode,
  renderEndNode,
  renderMessageNode,
  renderDecisionNode,
  renderActionNode,
  renderOptionNode,
  renderHttpRequestNode,
  renderWebhookNode,
  renderDatabaseNode,
  renderAiNode,
  renderNlpNode,
  renderComplexConditionNode,
  renderPowerNode,
  renderDefaultNode,
  renderGenericNode,
} from './nodeTypeRenderers';

/**
 * Helper para renderizar el contenido de UltraOptimizedNode usando helpers individuales
 * Reduce la complejidad del switch gigante usando funciones específicas
 */
export const renderUltraNodeContent = (type, data, id) => {
  // Usar Map seguro para evitar object injection
  const nodeRenderers = new Map([
    ['start', () => renderStartNode(data)],
    ['end', () => renderEndNode(data)],
    ['message', () => renderMessageNode(data)],
    ['decision', () => renderDecisionNode(data)],
    ['action', () => renderActionNode(data)],
    ['option', () => renderOptionNode(data)],
    ['HTTP_REQUEST_NODE', () => renderHttpRequestNode(data)],
    ['WEBHOOK_NODE', () => renderWebhookNode(data)],
    ['DATABASE_NODE', () => renderDatabaseNode(data)],
    ['AI_NODE', () => renderAiNode(data)],
    ['NLP_NODE', () => renderNlpNode(data)],
    ['COMPLEX_CONDITION_NODE', () => renderComplexConditionNode(data)],
    ['POWER_NODE', () => renderPowerNode(data)],
    ['default', () => renderDefaultNode(data)],
    ['defaultNode', () => renderDefaultNode(data)],
  ]);

  const renderer = nodeRenderers.get(type) || (() => renderGenericNode(type, data, id));
  return renderer();
};

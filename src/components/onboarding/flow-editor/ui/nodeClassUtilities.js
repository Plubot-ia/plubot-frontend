/**
 * Utilidades para generar clases CSS de nodos
 * Extraído de UltraOptimizedNode.jsx para reducir complejidad
 *
 * @author Cascade AI
 * @version 1.0.0
 */

/**
 * Mapeo directo de tipos de nodo a sus clases CSS
 */
const NODE_TYPE_MAPPING = {
  start: 'start-node',
  end: 'end-node',
  message: 'message-node',
  decision: 'decision-node',
  action: 'action-node',
  option: 'option-node',
  HTTP_REQUEST_NODE: 'httprequest-node',
  WEBHOOK_NODE: 'webhook-node',
  DATABASE_NODE: 'database-node',
  AI_NODE: 'ai-node',
  NLP_NODE: 'nlp-node',
  COMPLEX_CONDITION_NODE: 'complex-condition-node',
  POWER_NODE: 'power-node',
  default: 'message-node',
  defaultNode: 'message-node',
};

/**
 * Genera la clase CSS base para un tipo de nodo específico
 *
 * @param {string} type - Tipo del nodo
 * @returns {string} Clase CSS base del nodo
 */
export const getNodeTypeClass = (type) => {
  // Usar el mapeo existente si existe
  // eslint-disable-next-line security/detect-object-injection -- type controlled by node props
  if (NODE_TYPE_MAPPING[type]) {
    // eslint-disable-next-line security/detect-object-injection -- type controlled by node props
    return NODE_TYPE_MAPPING[type];
  }

  // Si no existe en el mapeo, intentar convertir el tipo a un formato válido
  try {
    return `${type.toLowerCase().replaceAll(/[_\s]+/g, '-')}-node`;
  } catch {
    // Si hay cualquier error (tipo nulo, indefinido, etc), usar un tipo por defecto
    return 'message-node';
  }
};

/**
 * Genera la clase CSS completa del nodo incluyendo estados
 *
 * @param {string} type - Tipo del nodo
 * @param {boolean} selected - Si el nodo está seleccionado
 * @param {boolean} isHovered - Si el nodo está en hover
 * @returns {string} Clase CSS completa del nodo
 */
export const generateNodeClass = (type, selected, isHovered) => {
  const nodeTypeClass = getNodeTypeClass(type);
  const selectedClass = selected ? 'selected' : '';
  const hoverClass = isHovered ? 'hover' : '';

  return `react-flow__node ${nodeTypeClass} ${selectedClass} ${hoverClass}`.trim();
};

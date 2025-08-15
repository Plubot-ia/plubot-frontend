// src/utils/nodeValidation.js
import { NODE_TYPES } from './node-config.js';

// Definición de reglas de validación para cada tipo de nodo.
// Deberás completar esto según la lógica de tu aplicación.
// Ejemplos:
// maxOutDegree: máximo de conexiones salientes
// minInDegree: mínimo de conexiones entrantes
// allowedOutgoingConnections: objeto/array definiendo a qué tipos de nodos se puede conectar
export const NODE_TYPES_VALIDATIONS = {
  [NODE_TYPES.START_NODE]: {
    maxOutDegree: 1,
    maxInDegree: 0,
    // allowedOutgoingConnections: [NODE_TYPES.MESSAGE_NODE, NODE_TYPES.DECISION_NODE], // Ejemplo
  },
  [NODE_TYPES.MESSAGE_NODE]: {
    maxOutDegree: 1, // Usualmente un mensaje lleva a una sola cosa después
    minInDegree: 1,
  },
  [NODE_TYPES.DECISION_NODE]: {
    minOutDegree: 1, // Una decisión debe tener al menos una salida (o 2 para ser útil)
    minInDegree: 1,
  },
  [NODE_TYPES.END_NODE]: {
    maxOutDegree: 0,
    minInDegree: 1,
  },
  [NODE_TYPES.KNOWLEDGE_BASE_NODE]: {
    maxOutDegree: 1,
    minInDegree: 1,
  },
  // Añade aquí validaciones para otros tipos de nodos que tengas (API_NODE, CONDITION_NODE, etc.)
};

/**
 * Valida un nodo individualmente o en el contexto de otros nodos y aristas.
 * @param {object} node El nodo a validar.
 * @param {array} nodes Array de todos los nodos en el flujo (opcional).
 * @param {array} edges Array de todas las aristas en el flujo (opcional).
 * @returns {object} Objeto con propiedades 'valid' y 'errors'.
 */
const checkDegreeConstraints = ({ node, rules, inDegree, outDegree }) => {
  const errors = [];
  const label = node.data.label || node.id;
  const nodeInfo = `El nodo '${label}' (${node.type})`;

  if (rules.maxOutDegree !== undefined && outDegree > rules.maxOutDegree) {
    errors.push(`${nodeInfo} excede el máximo de ${rules.maxOutDegree} conexiones de salida.`);
  }
  if (rules.minOutDegree !== undefined && outDegree < rules.minOutDegree) {
    errors.push(`${nodeInfo} requiere al menos ${rules.minOutDegree} conexiones de salida.`);
  }
  if (rules.maxInDegree !== undefined && inDegree > rules.maxInDegree) {
    errors.push(`${nodeInfo} excede el máximo de ${rules.maxInDegree} conexiones de entrada.`);
  }
  if (rules.minInDegree !== undefined && inDegree < rules.minInDegree) {
    errors.push(`${nodeInfo} requiere al menos ${rules.minInDegree} conexiones de entrada.`);
  }

  return errors;
};

export const validateNode = (node, nodes = [], edges = []) => {
  if (!node || !node.type) {
    return { valid: false, errors: ['El nodo o su tipo no están definidos.'] };
  }

  const validationRules = NODE_TYPES_VALIDATIONS[node.type];
  if (!validationRules) {
    return { valid: true, errors: [] };
  }

  let errors = [];
  if (nodes.length > 0 && edges.length > 0) {
    const outDegree = edges.filter((edge) => edge.source === node.id).length;
    const inDegree = edges.filter((edge) => edge.target === node.id).length;
    errors = checkDegreeConstraints({
      node,
      rules: validationRules,
      inDegree,
      outDegree,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Valida las reglas del nodo fuente (source) en una conexión.
 * @param {object} sourceNode - El nodo fuente.
 * @param {object} targetNode - El nodo destino.
 * @param {array} edges - Array de todas las aristas.
 * @returns {boolean} - true si las reglas del source son válidas.
 */
function validateSourceNode(sourceNode, targetNode, edges) {
  const sourceRules = NODE_TYPES_VALIDATIONS[sourceNode.type];
  if (!sourceRules) return true;

  const outDegree = edges.filter((edge) => edge.source === sourceNode.id).length;
  const { maxOutDegree, allowedOutgoingConnections } = sourceRules;

  if (maxOutDegree !== undefined && outDegree >= maxOutDegree) {
    return false;
  }

  return !allowedOutgoingConnections || allowedOutgoingConnections.includes(targetNode.type);
}

/**
 * Valida las reglas del nodo destino (target) en una conexión.
 * @param {object} targetNode - El nodo destino.
 * @param {array} edges - Array de todas las aristas.
 * @returns {boolean} - true si las reglas del target son válidas.
 */
function validateTargetNode(targetNode, edges) {
  const targetRules = NODE_TYPES_VALIDATIONS[targetNode.type];
  if (!targetRules) return true;

  const inDegree = edges.filter((edge) => edge.target === targetNode.id).length;
  const { maxInDegree } = targetRules;

  return maxInDegree === undefined || inDegree < maxInDegree;
}

/**
 * Valida si una conexión entre dos nodos es permitida.
 * @param {object} connection Objeto de conexión de React Flow.
 * @param {array} nodes Array de todos los nodos.
 * @param {array} edges Array de todas las aristas.
 * @returns {boolean} True si la conexión es válida.
 */
export const validateConnection = (connection, nodes, edges) => {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  // Validar reglas del nodo fuente y destino
  return validateSourceNode(sourceNode, targetNode, edges) && validateTargetNode(targetNode, edges);
};

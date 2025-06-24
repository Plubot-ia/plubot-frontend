// src/utils/nodeValidation.js
import { NODE_TYPES } from './nodeConfig'; // Asegúrate que NODE_TYPES esté en nodeConfig.js y se exporte

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
 * @param {array} nodes Array de todos los nodos en el flujo (opcional, para validaciones de contexto).
 * @param {array} edges Array de todas las aristas en el flujo (opcional, para validaciones de contexto).
 * @returns {object} Objeto con propiedades 'valid' y 'errors'.
 */
export const validateNode = (node, nodes = [], edges = []) => {
  if (!node || !node.type) {

    return { valid: false, errors: ['Node o node.type es undefined.'] };
  }

  const validationRules = NODE_TYPES_VALIDATIONS[node.type];

  if (!validationRules) {

    return { valid: true, errors: [] }; // Ensure errors array is always returned
  }

  const errors = [];

  // Ejemplo de validación de grado (número de conexiones)
  if (nodes.length > 0 && edges.length > 0) {
    const outDegree = edges.filter(edge => edge.source === node.id).length;
    const inDegree = edges.filter(edge => edge.target === node.id).length;

    if (validationRules.maxOutDegree !== undefined && outDegree > validationRules.maxOutDegree) {

      errors.push(`Nodo '${node.data.label || node.id}' (tipo: ${node.type}) excede el máximo de ${validationRules.maxOutDegree} conexiones de salida.`);
    }
    if (validationRules.minOutDegree !== undefined && outDegree < validationRules.minOutDegree) {

      errors.push(`Nodo '${node.data.label || node.id}' (tipo: ${node.type}) requiere al menos ${validationRules.minOutDegree} conexiones de salida.`);
    }
    if (validationRules.maxInDegree !== undefined && inDegree > validationRules.maxInDegree) {

      errors.push(`Nodo '${node.data.label || node.id}' (tipo: ${node.type}) excede el máximo de ${validationRules.maxInDegree} conexiones de entrada.`);
    }
    if (validationRules.minInDegree !== undefined && inDegree < validationRules.minInDegree) {

      errors.push(`Nodo '${node.data.label || node.id}' (tipo: ${node.type}) requiere al menos ${validationRules.minInDegree} conexiones de entrada.`);
    }
  }

  // Aquí puedes añadir más lógica de validación específica para los datos del nodo, etc.
  // Por ejemplo, verificar que campos requeridos en node.data estén presentes.

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Valida si una conexión entre dos nodos es permitida.
 * @param {object} connection El objeto de conexión de React Flow ({ source, target, sourceHandle, targetHandle }).
 * @param {array} nodes Array de todos los nodos.
 * @param {array} edges Array de todas las aristas.
 * @returns {boolean} True si la conexión es válida.
 */
export const validateConnection = (connection, nodes, edges) => {
  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);

  if (!sourceNode || !targetNode) {

    return false;
  }

  const sourceValidationRules = NODE_TYPES_VALIDATIONS[sourceNode.type];

  if (sourceValidationRules) {
    // Validar grado de salida del nodo origen si está definido
    const outDegree = edges.filter(edge => edge.source === sourceNode.id).length;
    if (sourceValidationRules.maxOutDegree !== undefined && outDegree >= sourceValidationRules.maxOutDegree) {
      // alert(`El nodo '${sourceNode.data.label}' ya alcanzó su máximo de conexiones de salida.`);

      return false;
    }

    // Validar si el tipo de nodo destino es permitido desde el origen
    if (sourceValidationRules.allowedOutgoingConnections &&
        !sourceValidationRules.allowedOutgoingConnections.includes(targetNode.type)) {
      // alert(`No se puede conectar un nodo '${sourceNode.type}' a un nodo '${targetNode.type}'.`);

      return false;
    }
  }

  const targetValidationRules = NODE_TYPES_VALIDATIONS[targetNode.type];
  if (targetValidationRules) {
    // Validar grado de entrada del nodo destino si está definido
    const inDegree = edges.filter(edge => edge.target === targetNode.id).length;
    if (targetValidationRules.maxInDegree !== undefined && inDegree >= targetValidationRules.maxInDegree) {
      // alert(`El nodo '${targetNode.data.label}' ya alcanzó su máximo de conexiones de entrada.`);

      return false;
    }
  }

  return true; // Si pasa todas las validaciones
};

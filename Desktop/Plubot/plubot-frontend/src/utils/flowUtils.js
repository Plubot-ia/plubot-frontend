// flowUtils.js
import { MarkerType } from 'reactflow';
import { NODE_TYPES, EDGE_TYPES, EDGE_COLORS, NODE_DEFAULT_SIZES } from './nodeConfig';

/**
 * Valida un nodo según su tipo y datos.
 * @param {Object} node - El nodo a validar.
 * @returns {Object} - Resultado de la validación { valid: boolean, errors: string[], node: Object }
 */
export const validateNode = (node) => {
  const errors = [];
  let validatedNode = { ...node };

  if (!node.id) errors.push('El nodo debe tener un ID único.');
  if (!NODE_TYPES[node.type]) errors.push(`Tipo de nodo inválido: ${node.type}`);
  if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
    errors.push('El nodo debe tener una posición válida.');
  }

  switch (node.type) {
    case NODE_TYPES.start:
      if (!node.data?.label) errors.push('El nodo de inicio debe tener una etiqueta.');
      break;
    case NODE_TYPES.end:
      if (!node.data?.label) errors.push('El nodo de fin debe tener una etiqueta.');
      break;
    case NODE_TYPES.message:
      if (!node.data?.message) errors.push('El nodo de mensaje debe tener un contenido.');
      break;
    case NODE_TYPES.decision:
      if (!node.data?.question) errors.push('El nodo de decisión debe tener una pregunta.');
      if (!Array.isArray(node.data?.outputs) || node.data.outputs.length < 2) {
        errors.push('El nodo de decisión debe tener al menos dos opciones.');
      }
      break;
    case NODE_TYPES.action:
      if (!node.data?.actionType) errors.push('El nodo de acción debe tener un tipo de acción.');
      break;
    case NODE_TYPES.option:
      if (!node.data?.condition) errors.push('El nodo de opción debe tener una condición.');
      break;
    default:
      errors.push('Tipo de nodo desconocido.');
  }

  return {
    valid: errors.length === 0,
    errors,
    node: validatedNode,
  };
};

/**
 * Obtiene el tamaño predeterminado de un nodo según su tipo.
 * @param {string} type - Tipo de nodo.
 * @returns {Object} - { width: number, height: number }
 */
export const getNodeSize = (type) => {
  return NODE_DEFAULT_SIZES[type] || { width: 150, height: 80 };
};

/**
 * Crea una nueva arista con las propiedades adecuadas.
 * @param {Object} params - Parámetros de la arista { source, target, sourceHandle, sourceNodeType }
 * @returns {Object} - Nueva arista
 */
export const createEdge = ({ source, target, sourceHandle = null, sourceNodeType }) => {
  let edgeType = EDGE_TYPES.default;
  if (sourceNodeType === NODE_TYPES.decision) edgeType = EDGE_TYPES.warning;
  else if (sourceNodeType === NODE_TYPES.action) edgeType = EDGE_TYPES.success;
  else if (sourceNodeType === NODE_TYPES.end) edgeType = EDGE_TYPES.danger;

  return {
    id: `e-${source}-${target}-${Date.now()}`,
    source,
    target,
    sourceHandle,
    type: edgeType,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: EDGE_COLORS[edgeType],
    },
  };
};
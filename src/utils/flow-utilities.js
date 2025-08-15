// flowUtils.js
import { MarkerType } from 'reactflow';

import { NODE_TYPES, EDGE_TYPES, EDGE_COLORS, NODE_DEFAULT_SIZES } from './node-config.js';

let nodeIdCounter = 0;

const nodeInitializers = {
  [NODE_TYPES.message]: (data) => {
    if (!data.message) data.message = '';
  },
  [NODE_TYPES.decision]: (data) => {
    if (!data.question) data.question = '';
    if (!Array.isArray(data.outputs)) data.outputs = [];
  },
  [NODE_TYPES.action]: (data) => {
    if (!data.actionType) data.actionType = 'custom';
  },
  [NODE_TYPES.option]: (data) => {
    if (!data.condition) data.condition = '';
  },
};

/**
 * Valida y normaliza un nodo, asegurando que tenga las propiedades básicas.
 * @param {Object} node - El nodo a validar.
 * @returns {Object} - Resultado de la validación { valid: boolean, errors: string[], node: Object }
 */
export const validateNode = (node) => {
  const errors = [];
  const validatedNode = { ...node };

  // Validar que el nodo tenga un ID
  if (!node.id) {
    nodeIdCounter += 1;
    validatedNode.id = `node-${Date.now()}-${nodeIdCounter}`;
  }

  // No se valida el tipo para permitir tipos personalizados

  // Validar posición
  if (
    !node.position ||
    typeof node.position.x !== 'number' ||
    typeof node.position.y !== 'number'
  ) {
    validatedNode.position = { x: 100, y: 100 };
  }

  // Validar datos del nodo
  if (!node.data) {
    validatedNode.data = {};
  }

  // Asegurar que tenga una etiqueta
  if (!validatedNode.data.label) {
    const nodeTypeLabel =
      node.type.charAt(0).toUpperCase() + node.type.slice(1).replaceAll(/([A-Z])/g, ' $1');
    nodeIdCounter += 1;
    validatedNode.data.label = `${nodeTypeLabel} ${nodeIdCounter}`;
  }

  // Inicializar campos estándar según el tipo de nodo
  const nodeInitializer = nodeInitializers[node.type];
  if (nodeInitializer) {
    nodeInitializer(validatedNode.data);
  }

  return {
    valid: true,
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
  if (Object.prototype.hasOwnProperty.call(NODE_DEFAULT_SIZES, type)) {
    // eslint-disable-next-line security/detect-object-injection
    return NODE_DEFAULT_SIZES[type];
  }
  return { width: 150, height: 80 };
};

/**
 * Crea una nueva arista con las propiedades adecuadas.
 * @param {Object} params - Parámetros de la arista { source, target, sourceHandle, sourceNodeType }
 * @returns {Object} - Nueva arista
 */
export const createEdge = ({ source, target, sourceHandle, sourceNodeType }) => {
  let edgeType = EDGE_TYPES.default;
  switch (sourceNodeType) {
    case NODE_TYPES.decision: {
      edgeType = EDGE_TYPES.warning;
      break;
    }
    case NODE_TYPES.action: {
      edgeType = EDGE_TYPES.success;
      break;
    }
    case NODE_TYPES.end: {
      edgeType = EDGE_TYPES.danger;
      break;
    }
    default: {
      break;
    }
  }

  return {
    id: `e-${source}-${target}-${Date.now()}`,
    source,
    target,
    sourceHandle,
    type: edgeType,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: (() => {
        if (Object.prototype.hasOwnProperty.call(EDGE_COLORS, edgeType)) {
          // eslint-disable-next-line security/detect-object-injection
          return EDGE_COLORS[edgeType];
        }
        return '#b1b1b7';
      })(),
    },
  };
};

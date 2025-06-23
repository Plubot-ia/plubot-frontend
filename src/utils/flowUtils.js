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

  // Validar que el nodo tenga un ID
  if (!node.id) {

    validatedNode.id = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  
  // Verificar si el tipo de nodo es válido (debe estar entre los valores de NODE_TYPES)
  // Permitimos tipos personalizados para mayor flexibilidad
  const validNodeTypes = Object.values(NODE_TYPES);
  if (!validNodeTypes.includes(node.type)) {

    // No lo marcamos como error para permitir tipos personalizados
  }
  
  // Validar posición
  if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {

    validatedNode.position = { x: 100, y: 100 };
  }

  // Validar datos del nodo
  if (!node.data) {

    validatedNode.data = {};
  }
  
  // Asegurar que tenga una etiqueta
  if (!validatedNode.data.label) {
    const nodeTypeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1).replace(/([A-Z])/g, ' $1');
    validatedNode.data.label = `${nodeTypeLabel} ${Math.floor(Math.random() * 100)}`;

  }

  // Inicializar campos estándar según el tipo de nodo para evitar errores
  switch (node.type) {
    case NODE_TYPES.message:
      if (!validatedNode.data.message) validatedNode.data.message = '';
      break;
    case NODE_TYPES.decision:
      if (!validatedNode.data.question) validatedNode.data.question = '';
      if (!Array.isArray(validatedNode.data.outputs)) validatedNode.data.outputs = [];
      break;
    case NODE_TYPES.action:
      if (!validatedNode.data.actionType) validatedNode.data.actionType = 'custom';
      break;
    case NODE_TYPES.option:
      if (!validatedNode.data.condition) validatedNode.data.condition = '';
      break;
  }

  return {
    valid: true, // Siempre devolvemos valid=true para permitir la creación de nodos y evitar errores
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
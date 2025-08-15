import { sanitizeNode, sanitizeNumber, sanitizeBounds } from './minimap-sanitizer';

/**
 * Helper para validar si un nodo tiene posición y dimensiones válidas
 * @param {Object} node - Nodo a validar
 * @returns {boolean} True si el nodo es válido
 */
export const isValidNode = (node) => {
  if (
    !node ||
    !node.position ||
    !Number.isFinite(node.position.x) ||
    !Number.isFinite(node.position.y)
  ) {
    return false;
  }
  return (
    node &&
    node.position &&
    typeof node.position.x === 'number' &&
    typeof node.position.y === 'number' &&
    !Number.isNaN(node.position.x) &&
    !Number.isNaN(node.position.y)
  );
};

/**
 * Helper para filtrar y sanitizar nodos válidos
 * @param {Array} nodes - Lista de nodos
 * @returns {Array} Lista de nodos válidos y sanitizados
 */
export const filterAndSanitizeNodes = (nodes) => {
  if (!nodes || !Array.isArray(nodes)) return [];

  return nodes.filter((node) => isValidNode(node)).map((node) => sanitizeNode(node));
};

/**
 * Helper para calcular los límites del diagrama
 * @param {Array} nodeList - Lista de nodos válidos
 * @returns {Object} Límites del diagrama con centro calculado
 */
export const calculateDiagramBounds = (nodeList) => {
  if (!nodeList || nodeList.length === 0) {
    return {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      centerX: 50,
      centerY: 50,
    };
  }

  try {
    const bounds = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };

    for (const node of nodeList) {
      const nodeX = sanitizeNumber(node.position.x, 0);
      const nodeY = sanitizeNumber(node.position.y, 0);
      const nodeWidth = sanitizeNumber(node.width, 150);
      const nodeHeight = sanitizeNumber(node.height, 40);

      bounds.minX = Math.min(bounds.minX, nodeX);
      bounds.maxX = Math.max(bounds.maxX, nodeX + nodeWidth);
      bounds.minY = Math.min(bounds.minY, nodeY);
      bounds.maxY = Math.max(bounds.maxY, nodeY + nodeHeight);
    }

    if (bounds.minX === bounds.maxX) {
      bounds.minX -= 50;
      bounds.maxX += 50;
    }
    if (bounds.minY === bounds.maxY) {
      bounds.minY -= 50;
      bounds.maxY += 50;
    }

    const diagramWidth = bounds.maxX - bounds.minX;
    const diagramHeight = bounds.maxY - bounds.minY;
    const centerX = bounds.minX + diagramWidth / 2;
    const centerY = bounds.minY + diagramHeight / 2;

    const margin = Math.max(30, Math.min(diagramWidth, diagramHeight) * 0.1);
    bounds.minX = centerX - (diagramWidth / 2 + margin);
    bounds.maxX = centerX + (diagramWidth / 2 + margin);
    bounds.minY = centerY - (diagramHeight / 2 + margin);
    bounds.maxY = centerY + (diagramHeight / 2 + margin);

    return sanitizeBounds({ ...bounds, centerX, centerY });
  } catch {
    return {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      centerX: 50,
      centerY: 50,
    };
  }
};

// Helper: Validar tipos de coordenadas
const hasValidCoordinateTypes = (bounds) => {
  return (
    typeof bounds.minX === 'number' &&
    typeof bounds.maxX === 'number' &&
    typeof bounds.minY === 'number' &&
    typeof bounds.maxY === 'number'
  );
};

// Helper: Validar que las coordenadas no sean NaN
const hasValidCoordinateValues = (bounds) => {
  return (
    !Number.isNaN(bounds.minX) &&
    !Number.isNaN(bounds.maxX) &&
    !Number.isNaN(bounds.minY) &&
    !Number.isNaN(bounds.maxY)
  );
};

// Helper: Validar lógica de límites
const hasValidBoundsLogic = (bounds) => {
  return bounds.minX < bounds.maxX && bounds.minY < bounds.maxY;
};

/**
 * Helper para validar límites del diagrama
 * @param {Object} bounds - Límites del diagrama a validar
 * @returns {boolean} True si los límites son válidos
 */
export const validateDiagramBounds = (bounds) => {
  if (!bounds) return false;

  return (
    hasValidCoordinateTypes(bounds) &&
    hasValidCoordinateValues(bounds) &&
    hasValidBoundsLogic(bounds)
  );
};

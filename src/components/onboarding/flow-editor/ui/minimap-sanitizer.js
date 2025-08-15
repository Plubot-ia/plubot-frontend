/**
 * minimap-sanitizer.js
 * Utilidad para sanitizar valores utilizados en el MiniMap y prevenir errores de tipo
 * "The provided value is non-finite"
 */

/**
 * Verifica si un valor es un número válido (no NaN ni Infinity)
 * @param {any} value - Valor a verificar
 * @returns {boolean} - true si es un número finito, false en caso contrario
 */
export const isFiniteNumber = (value) => {
  return typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value);
};

/**
 * Sanitiza un valor para asegurar que sea un número finito
 * @param {any} value - Valor a sanitizar
 * @param {number} defaultValue - Valor por defecto si no es un número válido
 * @returns {number} - Valor sanitizado
 */
export const sanitizeNumber = (value, defaultValue = 0) => {
  return isFiniteNumber(value) ? value : defaultValue;
};

/**
 * Sanitiza un objeto de coordenadas para asegurar que sus propiedades sean números finitos
 * @param {Object} coords - Objeto con coordenadas (x, y)
 * @param {Object} defaultCoords - Coordenadas por defecto
 * @returns {Object} - Objeto con coordenadas sanitizadas
 */
export const sanitizeCoords = (coords, defaultCoordsParameter) => {
  const defaultCoords = defaultCoordsParameter || { x: 0, y: 0 };
  if (!coords || typeof coords !== 'object') return { ...defaultCoords };

  return {
    x: sanitizeNumber(coords.x, defaultCoords.x),
    y: sanitizeNumber(coords.y, defaultCoords.y),
  };
};

/**
 * Sanitiza un viewport para asegurar que sus propiedades sean números finitos
 * @param {Object} viewport - Objeto viewport con x, y y zoom
 * @returns {Object} - Viewport sanitizado
 */
export const sanitizeViewport = (viewport) => {
  if (!viewport || typeof viewport !== 'object') {
    return { x: 0, y: 0, zoom: 1 };
  }

  return {
    x: sanitizeNumber(viewport.x, 0),
    y: sanitizeNumber(viewport.y, 0),
    zoom: sanitizeNumber(viewport.zoom, 1),
    setViewport: viewport.setViewport,
  };
};

/**
 * Sanitiza bounds de un diagrama para evitar valores no finitos
 * @param {Object} bounds - Objeto con límites del diagrama
 * @returns {Object} - Bounds sanitizados
 */
export const sanitizeBounds = (bounds) => {
  if (!bounds || typeof bounds !== 'object') {
    return {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      centerX: 50,
      centerY: 50,
    };
  }

  const sanitized = {
    minX: sanitizeNumber(bounds.minX, 0),
    maxX: sanitizeNumber(bounds.maxX, 100),
    minY: sanitizeNumber(bounds.minY, 0),
    maxY: sanitizeNumber(bounds.maxY, 100),
    centerX: sanitizeNumber(bounds.centerX, 50),
    centerY: sanitizeNumber(bounds.centerY, 50),
  };

  // Asegurar coherencia entre los valores
  if (sanitized.minX >= sanitized.maxX) {
    sanitized.maxX = sanitized.minX + 100;
  }

  if (sanitized.minY >= sanitized.maxY) {
    sanitized.maxY = sanitized.minY + 100;
  }

  return sanitized;
};

/**
 * Sanitiza un nodo para asegurar que sus propiedades sean válidas
 * @param {Object} node - Nodo a sanitizar
 * @returns {Object|null} - Nodo sanitizado o null si no es válido
 */
export const sanitizeNode = (node) => {
  if (!node || typeof node !== 'object') {
    return;
  }

  return {
    ...node,
    position: sanitizeCoords(node.position),
    width: sanitizeNumber(node.width, 150),
    height: sanitizeNumber(node.height, 40),
  };
};

const SanitizerUtilities = {
  isFiniteNumber,
  sanitizeNumber,
  sanitizeCoords,
  sanitizeViewport,
  sanitizeBounds,
  sanitizeNode,
};

export default SanitizerUtilities;

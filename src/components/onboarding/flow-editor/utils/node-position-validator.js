/**
 * node-position-validator.js
 *
 * Utilidad para validar y corregir posiciones de nodos en React Flow
 * Resuelve problemas de nodos apilados en (0,0) y errores NaN en aristas
 */

// Constantes de posicionamiento
const DEFAULT_X = 250;
const DEFAULT_Y = 150;
const POSITION_STEP = 50;
const MAX_ATTEMPTS = 100;

/**
 * Verifica si una posición es válida (no undefined, null o NaN)
 * @param {Object|null|undefined} position - La posición a verificar
 * @returns {boolean} - True si la posición es válida
 */
export const isValidPosition = (position) => {
  if (!position || typeof position !== 'object') return false;

  const { x, y } = position;
  return (
    x !== undefined &&
    y !== undefined &&
    x !== null &&
    y !== null &&
    !Number.isNaN(x) &&
    !Number.isNaN(y) &&
    Number.isFinite(x) &&
    Number.isFinite(y)
  );
};

/**
 * Genera una posición válida única que no esté ocupada por otros nodos
 * @param {Array} existingNodes - Nodos existentes para evitar colisiones
 * @param {Object} preferredPosition - Posición preferida (opcional)
 * @returns {Object} - Una posición válida {x, y}
 */
export const generateValidPosition = (existingNodes = [], preferredPosition) => {
  // Si hay una posición preferida y es válida, usarla
  if (preferredPosition && isValidPosition(preferredPosition)) {
    return preferredPosition;
  }

  // Crear un mapa de posiciones ocupadas para verificación rápida
  const occupiedPositions = new Set();
  for (const node of existingNodes) {
    if (isValidPosition(node.position)) {
      occupiedPositions.add(`${Math.round(node.position.x)},${Math.round(node.position.y)}`);
    }
  }

  // Intentar posiciones incrementales hasta encontrar una libre
  let x = DEFAULT_X;
  let y = DEFAULT_Y;
  let attempts = 0;

  while (occupiedPositions.has(`${Math.round(x)},${Math.round(y)}`) && attempts < MAX_ATTEMPTS) {
    // Patrón en espiral para distribuir nodos
    if (attempts % 2 === 0) {
      x += POSITION_STEP * Math.ceil(attempts / 2);
    } else {
      y += POSITION_STEP * Math.ceil(attempts / 2);
    }
    attempts++;
  }

  // Si agotamos los intentos, usar posicionamiento en espiral determinístico
  if (attempts >= MAX_ATTEMPTS) {
    // Algoritmo de espiral determinística: más predecible y debuggeable que posicionamiento aleatorio
    const spiralRadius = 100;
    const spiralSpacing = 50;
    const angle = (attempts - MAX_ATTEMPTS) * 0.5; // 0.5 radianes entre cada posición
    const radius = spiralRadius + (attempts - MAX_ATTEMPTS) * spiralSpacing;

    x = DEFAULT_X + radius * Math.cos(angle);
    y = DEFAULT_Y + radius * Math.sin(angle);
  }

  return { x, y };
};

/**
 * Asegura que todos los nodos tengan posiciones válidas
 * @param {Array} nodes - Los nodos a validar y corregir
 * @returns {Array} - Los nodos con posiciones validadas
 */
// Función segura para verificar si hay un arrastre en progreso
// que no afecta la secuencia de hooks de React
function isDraggingInProgress() {
  try {
    return globalThis && globalThis.__dragInProgress === true;
  } catch {
    return false;
  }
}

export const validateNodePositions = (nodes) => {
  // ULTRA IMPORTANTE: No realizar validaciones durante el arrastre
  // para maximizar el rendimiento y fluidez, pero de forma segura para React
  if (isDraggingInProgress()) {
    return nodes; // Devolver los nodos sin cambios durante el arrastre
  }

  if (!nodes || !Array.isArray(nodes)) {
    return []; // Simplemente devolver array vacío sin logging excesivo
  }

  // Verificar si hay nodos inválidos pero SIN filtrado completo (más eficiente)
  let hasInvalidNodes = false;
  for (const node of nodes) {
    if (!isValidPosition(node.position)) {
      hasInvalidNodes = true;
      break; // Salir al primer nodo inválido encontrado
    }
  }

  // Solo proceder si realmente hay nodos inválidos
  if (!hasInvalidNodes) {
    return nodes; // Retornar rápidamente si las posiciones son válidas
  }

  // Optimización: Crear un conjunto de nodos válidos una sola vez.
  const validNodes = nodes.filter((n) => isValidPosition(n.position));

  // Mapear y corregir los nodos inválidos de manera eficiente.
  return nodes.map((node) => {
    // Si la posición es válida, devolver el nodo sin cambios.
    if (isValidPosition(node.position)) {
      return node;
    }

    // Clonar el nodo para no mutar el original.
    const validatedNode = { ...node };

    // Generar una posición válida usando el conjunto pre-calculado de nodos válidos.
    validatedNode.position = generateValidPosition(
      validNodes,
      // Intentar recuperar valores parciales si es posible.
      node.position && typeof node.position === 'object'
        ? {
            x: Number.isNaN(node.position.x) ? undefined : node.position.x,
            y: Number.isNaN(node.position.y) ? undefined : node.position.y,
          }
        : undefined,
    );

    return validatedNode;
  });
};

/**
 * Middleware para Zustand que intercepta actualizaciones de nodos y valida posiciones
 * @param {Function} set - Función set de Zustand
 * @param {Function} get - Función get de Zustand
 * @returns {Function} - Función set modificada
 */
export const createNodeValidatorMiddleware = (set, _get) => (arguments_) => {
  // Llamar a la función set original con una función que procesa el estado
  return set((state) => {
    // Si el estado incluye nodes, validarlos
    if (arguments_.nodes) {
      return {
        ...arguments_,
        nodes: validateNodePositions(arguments_.nodes),
      };
    }

    // Si es una función, ejecutarla con el estado actual y validar el resultado
    if (typeof arguments_ === 'function') {
      const result = arguments_(state);

      if (result.nodes) {
        return {
          ...result,
          nodes: validateNodePositions(result.nodes),
        };
      }

      return result;
    }

    return arguments_;
  });
};

/**
 * Sanitiza los paths de las aristas para evitar errores NaN
 * @param {Array} edges - Las aristas a sanitizar
 * @param {Array} nodes - Los nodos para referencia
 * @returns {Array} - Las aristas sanitizadas
 */
export const sanitizeEdgePaths = () => {
  // Función que se ejecuta después del render para corregir paths SVG con NaN
  setTimeout(() => {
    const edgePaths = document.querySelectorAll('.react-flow__edge-path');
    let fixedCount = 0;

    for (const path of edgePaths) {
      const dAttribute = path.getAttribute('d');

      // Detectar si hay valores NaN en el path
      if (dAttribute && dAttribute.includes('NaN')) {
        // Simplificar lógica: ocultar arista con path mínimo cuando hay NaN
        path.setAttribute('d', 'M0,0');
        path.style.visibility = 'hidden';

        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      // Paths SVG de aristas parcheados con éxito
    }
  }, 100);
};

const nodePositionValidator = {
  isValidPosition,
  generateValidPosition,
  validateNodePositions,
  createNodeValidatorMiddleware,
  sanitizeEdgePaths,
};

export default nodePositionValidator;

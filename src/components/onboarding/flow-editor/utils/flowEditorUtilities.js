/**
 * Utilidades para el editor de flujos
 */

import { areHandlesEquivalent, normalizeSourceHandle } from '../../../../config/handleConfig';

/**
 * Función para debounce - limita la frecuencia de ejecución de una función
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} - Función con debounce
 */
export const debounce = (function_, wait) => {
  let timeout;
  return function executedFunction(...arguments_) {
    const later = () => {
      clearTimeout(timeout);
      function_(...arguments_);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Genera un ID único para un nodo
 * @param {string} nodeType - Tipo de nodo
 * @returns {string} - ID único
 */
export const generateNodeId = (nodeType) => {
  // Use crypto.randomUUID() for truly unique and secure ID generation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${nodeType}-${crypto.randomUUID()}`;
  }
  // Fallback determinístico para entornos sin crypto.randomUUID
  return `${nodeType}-${Date.now()}-${Date.now() % 1000}`;
};

/**
 * Función para throttle - limita la frecuencia de ejecución de una función usando requestAnimationFrame
 * @param {Function} func - Función a ejecutar
 * @returns {Function} - Función con throttle
 */
export const throttle = (function_) => {
  let rafId;
  let lastArguments;

  return function throttled(...arguments_) {
    lastArguments = arguments_;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        function_(...lastArguments);
        rafId = undefined;
      });
    }
  };
};

/**
 * Optimiza una función para eventos de arrastre usando throttle
 * @param {Function} func - Función a optimizar
 * @param {Object} options - Opciones de optimización
 * @returns {Function} - Función optimizada
 */
export const optimizeDragFunction = (function_, options = {}) => {
  const { useThrottle = true } = options;

  // Usar throttle para limitar a 60fps (usando requestAnimationFrame)
  if (useThrottle) {
    return throttle(function_);
  }

  return function_;
};

/**
 * Valida si una conexión ya existe
 * @param {Array} edges - Aristas existentes
 * @param {Object} params - Parámetros de la nueva conexión
 * @returns {boolean} - true si la conexión ya existe
 */
export const connectionExists = (edges, parameters) => {
  if (!edges || !Array.isArray(edges) || !parameters) {
    return false;
  }

  // Extraer propiedades de la conexión
  const { source, target, sourceHandle, targetHandle } = parameters;

  // Si falta alguna propiedad esencial, no podemos validar
  if (!source || !target) {
    return false;
  }

  // Verificar si existe una conexión con los mismos source y target
  const exists = edges.some((edge) => {
    // Comparar source y target (propiedades obligatorias)
    const sourceMatch = edge.source === source;
    const targetMatch = edge.target === target;

    // Si no coinciden source y target, no es la misma conexión
    if (!sourceMatch || !targetMatch) return false;

    // Comparar sourceHandle y targetHandle usando la configuración centralizada
    const edgeSourceHandle = normalizeSourceHandle(edge.sourceHandle);
    const edgeTargetHandle = edge.targetHandle || 'input';
    const parameterSourceHandle = normalizeSourceHandle(sourceHandle);
    const parameterTargetHandle = targetHandle || 'input';

    const handleMatch =
      areHandlesEquivalent(edgeSourceHandle, parameterSourceHandle) &&
      areHandlesEquivalent(edgeTargetHandle, parameterTargetHandle);

    return handleMatch;
  });

  return exists;
};

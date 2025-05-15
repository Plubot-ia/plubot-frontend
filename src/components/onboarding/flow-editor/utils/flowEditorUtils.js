/**
 * Utilidades para el editor de flujos
 */

/**
 * Función para debounce - limita la frecuencia de ejecución de una función
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} - Función con debounce
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
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
  return `${nodeType}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

/**
 * Función para throttle - limita la frecuencia de ejecución de una función usando requestAnimationFrame
 * @param {Function} func - Función a ejecutar
 * @returns {Function} - Función con throttle
 */
export const throttle = (func) => {
  let rafId = null;
  let lastArgs = null;
  
  return function throttled(...args) {
    lastArgs = args;
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func(...lastArgs);
        rafId = null;
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
export const optimizeDragFunction = (func, options = {}) => {
  const { useThrottle = true } = options;
  
  // Usar throttle para limitar a 60fps (usando requestAnimationFrame)
  if (useThrottle) {
    return throttle(func);
  }
  
  return func;
};


/**
 * Valida si una conexión ya existe
 * @param {Array} edges - Aristas existentes
 * @param {Object} params - Parámetros de la nueva conexión
 * @returns {boolean} - true si la conexión ya existe
 */
export const connectionExists = (edges, params) => {
  if (!edges || !Array.isArray(edges) || !params) return false;
  
  // Extraer propiedades de la conexión
  const { source, target, sourceHandle, targetHandle } = params;
  
  // Si falta alguna propiedad esencial, no podemos validar
  if (!source || !target) return false;
  
  // Verificar si existe una conexión con los mismos source y target
  return edges.some(edge => {
    // Comparar source y target (propiedades obligatorias)
    const sourceMatch = edge.source === source;
    const targetMatch = edge.target === target;
    
    // Si no coinciden source y target, no es la misma conexión
    if (!sourceMatch || !targetMatch) return false;
    
    // Comparar sourceHandle y targetHandle (con valores por defecto)
    const edgeSourceHandle = edge.sourceHandle || 'default';
    const edgeTargetHandle = edge.targetHandle || 'default';
    const paramSourceHandle = sourceHandle || 'default';
    const paramTargetHandle = targetHandle || 'default';
    
    return edgeSourceHandle === paramSourceHandle && edgeTargetHandle === paramTargetHandle;
  });
};

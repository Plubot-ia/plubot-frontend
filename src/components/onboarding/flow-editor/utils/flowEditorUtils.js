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
 * Valida si una conexión ya existe
 * @param {Array} edges - Aristas existentes
 * @param {Object} params - Parámetros de la nueva conexión
 * @returns {boolean} - true si la conexión ya existe
 */
export const connectionExists = (edges, params) => {
  const connectionKey = `${params.source}-${params.target}-${params.sourceHandle || 'default'}-${params.targetHandle || 'default'}`;
  const existingEdges = new Map();
  
  edges.forEach(edge => {
    const key = `${edge.source}-${edge.target}-${edge.sourceHandle || 'default'}-${edge.targetHandle || 'default'}`;
    existingEdges.set(key, true);
  });
  
  return existingEdges.has(connectionKey);
};

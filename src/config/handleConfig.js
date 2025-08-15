/**
 * @file handleConfig.js
 * @description Configuración centralizada para handle IDs en el editor de flujos
 *
 * Este archivo centraliza la configuración de handle IDs para evitar
 * referencias hardcodeadas y permitir una migración gradual de 'default' a 'output'
 */

/**
 * Handle ID por defecto para conexiones de salida
 * Migrado a 'output' como estándar para todos los nodos
 */
export const DEFAULT_SOURCE_HANDLE = 'output';

/**
 * Handle ID por defecto para conexiones de entrada
 */
export const DEFAULT_TARGET_HANDLE = 'input';

/**
 * Handle IDs aceptados como válidos para compatibilidad
 * Esto permite que tanto 'default' como 'output' sean reconocidos
 */
export const VALID_SOURCE_HANDLES = ['default', 'output'];

/**
 * Normaliza un handle ID de salida para compatibilidad
 * @param {string} handleId - El ID del handle a normalizar
 * @returns {string} El handle ID normalizado
 */
export function normalizeSourceHandle(handleId) {
  // Si no hay handle, usar el por defecto
  if (!handleId) return DEFAULT_SOURCE_HANDLE;

  // Si el handle es válido, mantenerlo
  if (VALID_SOURCE_HANDLES.includes(handleId)) return handleId;

  // Si no es reconocido, usar el por defecto
  return DEFAULT_SOURCE_HANDLE;
}

/**
 * Verifica si dos handle IDs son equivalentes
 * Considera 'default' y 'output' como equivalentes para compatibilidad
 * @param {string} handle1 - Primer handle ID
 * @param {string} handle2 - Segundo handle ID
 * @returns {boolean} True si son equivalentes
 */
export function areHandlesEquivalent(handle1, handle2) {
  // Normalizar nulls/undefined
  const h1 = handle1 || DEFAULT_SOURCE_HANDLE;
  const h2 = handle2 || DEFAULT_SOURCE_HANDLE;

  // Comparación directa
  if (h1 === h2) return true;

  // Considerar 'default' y 'output' como equivalentes
  const equivalentPairs = [
    ['default', 'output'],
    ['output', 'default'],
  ];

  return equivalentPairs.some(([a, b]) => h1 === a && h2 === b);
}

/**
 * Obtiene el handle ID apropiado para un tipo de nodo
 * @param {string} nodeType - El tipo de nodo
 * @param {string} handleType - 'source' o 'target'
 * @returns {string} El handle ID apropiado
 */
export function getHandleIdForNodeType(nodeType, handleType = 'source') {
  // MessageNode ahora usa 'output' como todos los demás nodos
  // Migración completada de 'default' a 'output'
  if (nodeType === 'message' || nodeType === 'messageNode') {
    return handleType === 'source' ? 'output' : DEFAULT_TARGET_HANDLE;
  }

  // Para otros nodos, usar el estándar
  return handleType === 'source' ? 'output' : 'input';
}

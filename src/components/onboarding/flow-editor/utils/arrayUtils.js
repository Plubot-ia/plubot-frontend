/**
 * Utilidades para comparación eficiente de arrays en el editor de flujos
 * Estas funciones mejoran drásticamente el rendimiento al evitar uso de JSON.stringify
 * para comparaciones frequentes
 *
 * @version 1.0
 * @created 2025-05-20
 */

/**
 * Compara dos arrays de objetos de manera eficiente sin usar JSON.stringify
 * Especialmente optimizado para arrays de aristas en ReactFlow
 *
 * @param {Array} arr1 - Primer array de objetos
 * @param {Array} arr2 - Segundo array de objetos
 * @param {Array} keyProps - Propiedades clave a comparar (para aristas: ['id', 'source', 'target'])
 * @returns {boolean} - True si los arrays son iguales, false en caso contrario
 */
export const isArraysEqual = (arr1, arr2, keyProps = ['id', 'source', 'target']) => {
  // Validaciones iniciales rápidas
  if (arr1 === arr2) return true;
  if (!arr1 || !arr2) return false;
  if (arr1.length !== arr2.length) return false;

  // Comparar elemento por elemento usando las propiedades clave
  for (let i = 0; i < arr1.length; i++) {
    const item1 = arr1[i];
    const item2 = arr2[i];

    // Validar que ambos elementos son objetos
    if (!item1 || !item2 || typeof item1 !== 'object' || typeof item2 !== 'object') {
      return false;
    }

    // Comparar propiedades clave
    for (const prop of keyProps) {
      if (item1[prop] !== item2[prop]) {
        return false;
      }
    }

    // Para aristas, también comparar sourceHandle y targetHandle si existen
    if (keyProps.includes('source') && (item1.sourceHandle !== item2.sourceHandle)) {
      return false;
    }
    if (keyProps.includes('target') && (item1.targetHandle !== item2.targetHandle)) {
      return false;
    }
  }

  return true;
};

/**
 * Versión más simple para comparar arrays de primitivos
 *
 * @param {Array} arr1 - Primer array
 * @param {Array} arr2 - Segundo array
 * @returns {boolean} - True si los arrays son iguales, false en caso contrario
 */
export const isPrimitiveArraysEqual = (arr1, arr2) => {
  if (arr1 === arr2) return true;
  if (!arr1 || !arr2) return false;
  if (arr1.length !== arr2.length) return false;

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  return true;
};

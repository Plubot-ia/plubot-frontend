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
export const isArraysEqual = (
  array1,
  array2,
  keyProperties = ['id', 'source', 'target'],
) => {
  // Validaciones iniciales rápidas
  if (array1 === array2) return true;
  if (!array1 || !array2) return false;
  if (array1.length !== array2.length) return false;

  // Comparar elemento por elemento usando las propiedades clave
  for (const [index, item1] of array1.entries()) {
    const item2 = array2[index];

    // Validar que ambos elementos son objetos
    if (
      !item1 ||
      !item2 ||
      typeof item1 !== 'object' ||
      typeof item2 !== 'object'
    ) {
      return false;
    }

    // Comparar propiedades clave
    for (const property of keyProperties) {
      if (item1[property] !== item2[property]) {
        return false;
      }
    }

    // Para aristas, también comparar sourceHandle y targetHandle si existen
    if (
      keyProperties.includes('source') &&
      item1.sourceHandle !== item2.sourceHandle
    ) {
      return false;
    }
    if (
      keyProperties.includes('target') &&
      item1.targetHandle !== item2.targetHandle
    ) {
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
export const isPrimitiveArraysEqual = (array1, array2) => {
  if (array1 === array2) return true;
  if (!array1 || !array2) return false;
  if (array1.length !== array2.length) return false;

  for (const [index, element] of array1.entries()) {
    if (element !== array2[index]) return false;
  }

  return true;
};

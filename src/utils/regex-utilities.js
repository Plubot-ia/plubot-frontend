/**
 * @file regex-utils.js
 * @description Utilidades para el manejo seguro de expresiones regulares.
 * @author PLUBOT Team & Cascade AI
 */

/**
 * Escapa los caracteres especiales de una cadena para que pueda ser utilizada
 * de forma segura en una expresión regular.
 * @param {string} str - La cadena a escapar.
 * @returns {string} - La cadena con los caracteres especiales de regex escapados.
 */
export const escapeRegex = (string_) => {
  if (typeof string_ !== 'string') return '';
  // Escapa caracteres que tienen un significado especial en regex.
  // $& en el reemplazo inserta la subcadena completa que coincidió.
  return string_.replaceAll(/[.*+?^${}()|[\]]/g, String.raw`\$&`);
};

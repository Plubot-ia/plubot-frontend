/**
 * @file lodUtils.js
 * @description Utilidades para el sistema de Nivel de Detalle (LOD).
 * @author PLUBOT Team
 * @version 1.0.0
 */

// Definimos constantes para los niveles de LOD para evitar errores tipográficos
export const LOD_LEVELS = {
  FULL: 'FULL',
  COMPACT: 'COMPACT',
  MINI: 'MINI',
};

// Umbrales de zoom para cada nivel de detalle. Estos valores pueden y deben ser ajustados
// durante las pruebas para encontrar el balance perfecto entre rendimiento y visibilidad.
// - FULL: zoom >= 0.3
// - COMPACT: 0.15 <= zoom < 0.3
// - MINI: zoom < 0.15
export const LOD_THRESHOLDS = {
  FULL: 0.3,
  COMPACT: 0.15,
};

/**
 * Determina el nivel de detalle (LOD) apropiado basado en el nivel de zoom actual.
 * Esta es una función pura, lo que la hace predecible y fácil de testear.
 *
 * @param {number} zoom - El nivel de zoom actual de React Flow.
 * @returns {string} - El nivel de LOD correspondiente (LOD_LEVELS.FULL, LOD_LEVELS.COMPACT, o LOD_LEVELS.MINI).
 */
export const getLODLevel = (zoom) => {
  if (zoom >= LOD_THRESHOLDS.FULL) {
    return LOD_LEVELS.FULL;
  }
  if (zoom >= LOD_THRESHOLDS.COMPACT) {
    return LOD_LEVELS.COMPACT;
  }
  return LOD_LEVELS.MINI;
};

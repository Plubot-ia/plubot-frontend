/**
 * @file lodUtilities.js
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

/**
 * Determina el nivel de detalle (LOD) apropiado basado en el nivel de zoom actual.
 * Esta es una función pura, lo que la hace predecible y fácil de testear.
 *
 * @param {number} zoom - El nivel de zoom actual de React Flow.
 * @returns {string} - El nivel de LOD correspondiente (LOD_LEVELS.FULL, LOD_LEVELS.COMPACT, o LOD_LEVELS.MINI).
 */
// Umbrales de LOD por defecto. Sirven como fallback y única fuente de verdad.
const DEFAULT_THRESHOLDS = {
  FULL: 0.3,
  COMPACT: 0.15,
};

/**
 * Determina el nivel de detalle (LOD) apropiado basado en el nivel de zoom actual.
 * Esta es una función pura, predecible y testeable.
 *
 * @param {number} zoom - El nivel de zoom actual de React Flow.
 * @param {object} [thresholds=DEFAULT_THRESHOLDS] - Umbrales para cada nivel. Si no se proveen, se usan los de por defecto.
 * @returns {string} - El nivel de LOD correspondiente (LOD_LEVELS.FULL, LOD_LEVELS.COMPACT, o LOD_LEVELS.MINI).
 */
export const getLODLevel = (zoom, thresholds = DEFAULT_THRESHOLDS) => {
  if (zoom >= thresholds.FULL) {
    return LOD_LEVELS.FULL;
  }
  if (zoom >= thresholds.COMPACT) {
    return LOD_LEVELS.COMPACT;
  }
  return LOD_LEVELS.MINI;
};

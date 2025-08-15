/**
 * Helper functions for edge presentation logic in FlowMain.jsx
 * Extraído para reducir líneas y complejidad del componente principal
 *
 * @author Cascade AI
 * @version 1.0.0
 */

import { LOD_LEVELS } from '../utils/lodUtilities';

/**
 * Agrega propiedades de presentación a un edge para renderizado
 *
 * @param {Object} edge - El edge base
 * @param {string} currentLodLevel - Nivel de LOD actual
 * @param {boolean} currentIsUltraMode - Si está en modo ultra
 * @returns {Object} Edge con propiedades de presentación
 */
export const addEdgePresentationProps = (edge, currentLodLevel, currentIsUltraMode) => {
  // CRITICAL: Ensure lodLevel is never undefined - fallback to FULL
  const safeLodLevel = currentLodLevel || LOD_LEVELS.FULL;

  // Logging temporarily disabled - was causing massive console spam
  // console.log('🔧 [addEdgePresentationProps] lodLevel fix:', {
  //   original: currentLodLevel,
  //   safe: safeLodLevel,
  //   edgeId: edge.id
  // });

  return {
    ...edge,
    type: edge.type || 'default', // CRITICAL: Ensure edge has a type for React Flow
    animated: !currentIsUltraMode && safeLodLevel === LOD_LEVELS.FULL,
    lodLevel: safeLodLevel, // CRITICAL: Always valid lodLevel for EliteEdge
    data: {
      ...edge.data,
      lodLevel: safeLodLevel, // Keep in data for backward compatibility
    },
  };
};

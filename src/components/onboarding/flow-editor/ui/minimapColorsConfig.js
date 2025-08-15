import { useMemo } from 'react';

import { EDGE_COLORS } from '@/utils/node-config.js';

/**
 * Custom hook para configuraciones de colores del minimapa
 * Sincronizado con EliteEdge para consistencia visual
 */
export const useMinimapColors = () => {
  // Mapa de colores para nodos y conexiones - CRÍTICOS para renderizado
  const nodeColors = useMemo(
    () => ({
      start: '#4facfe',
      end: '#ff6b6b',
      message: '#5139b3',
      decision: '#feca57',
      action: '#a55eea',
      option: '#48dbfb',
      default: '#4facfe',
    }),
    [],
  );

  // SINCRONIZADO CON ELITEEDGE: Usa los mismos colores que las aristas principales
  const edgeColors = useMemo(
    () => ({
      default: EDGE_COLORS.default || '#ff00ff', // Magenta neón como EliteEdge
      success: EDGE_COLORS.success || '#28a745',
      warning: EDGE_COLORS.warning || '#ffc107',
      danger: EDGE_COLORS.danger || '#dc3545',
      info: EDGE_COLORS.info || '#17a2b8',
      // Soporte para modo ultra si está activo
      ultra: {
        default: EDGE_COLORS.ultra?.default || '#8a2be2',
        success: EDGE_COLORS.ultra?.success || '#00cc7a',
        warning: EDGE_COLORS.ultra?.warning || '#cc9400',
        danger: EDGE_COLORS.ultra?.danger || '#cc2449',
      },
    }),
    [],
  );

  return { nodeColors, edgeColors };
};

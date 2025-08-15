/**
 * Efectos de rendimiento para integrar en FlowMain.jsx
 * Este archivo proporciona efectos modulares para activar el sistema de rendimiento adaptativo
 */

import { useEffect } from 'react';

/**
 * Efecto para activar el monitoreo de rendimiento
 * @param {Array} nodes - Nodos del flujo
 * @param {Array} edges - Aristas del flujo
 * @param {Function} startMonitoring - Funciu00f3n para iniciar el monitoreo
 * @param {Function} getStats - Funciu00f3n para obtener estadu00edsticas
 */
export const usePerformanceMonitoring = ({ nodes, edges, startMonitoring, getStats }) => {
  useEffect(() => {
    // No monitorear si alguna dependencia falta
    if (!nodes || !edges || !startMonitoring || !getStats) return;

    // Iniciar monitoreo con los nodos y aristas actuales
    const cleanup = startMonitoring(nodes, edges, getStats);

    // Limpieza cuando el componente se desmonte o cambien las dependencias
    return cleanup;
  }, [nodes, edges, startMonitoring, getStats]);
};

/**
 * Efecto para aplicar las clases CSS de optimizaciu00f3n
 * @param {string} optimizationLevel - Nivel actual de optimizaciu00f3n
 * @param {boolean} isUltraMode - Si el modo ultra estu00e1 activado
 * @param {Function} applyOptimizationClasses - Funciu00f3n para aplicar clases
 */
export const useOptimizationClassesEffect = (
  optimizationLevel,
  isUltraMode,
  applyOptimizationClasses,
) => {
  useEffect(() => {
    if (!applyOptimizationClasses) return;

    // Aplicar clases seguu00fan el nivel actual
    applyOptimizationClasses(isUltraMode);
  }, [optimizationLevel, isUltraMode, applyOptimizationClasses]);
};

/**
 * Efecto para activar completamente el sistema de rendimiento adaptativo
 * Esta es una combinaciu00f3n de los efectos individuales
 * @param {Object} params - Paru00e1metros necesarios
 */
export const useAdaptiveRenderingSystem = ({
  nodes,
  edges,
  optimizationLevel,
  isUltraMode,
  startMonitoring,
  applyOptimizationClasses,
  getStats,
}) => {
  // Activar monitoreo
  usePerformanceMonitoring({ nodes, edges, startMonitoring, getStats });

  // Aplicar clases CSS
  useOptimizationClassesEffect(optimizationLevel, isUltraMode, applyOptimizationClasses);
};

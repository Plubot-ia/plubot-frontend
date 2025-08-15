/**
 * Este archivo proporciona compatibilidad con versiones anteriores para hooks que han sido
 * reemplazados por implementaciones mejoradas. Utiliza nuestros nuevos hooks optimizados
 * para mantener la funcionalidad, pero con mejor rendimiento.
 *
 * VERSIÓN ACTUALIZADA: Usa el sistema unificado de rendimiento useAdaptivePerformance
 */

import { useCallback, useRef } from 'react';

import useAdaptivePerformance from '../components/onboarding/flow-editor/hooks/useAdaptivePerformance';

/**
 * Versiu00f3n compatible de useNodeHistory para componentes existentes
 * @returns {Object} - API compatible con el hook anterior
 */
export const useNodeHistory = () => {
  // Esta versiu00f3n compatible simplemente registra a consola, tal como haci00bda la original
  // Mantener la firma de la API por compatibilidad. La función es un no-op intencional.
  const addToHistory = useCallback((_nodeId, _historyEntry) => {
    // No-op for legacy compatibility
  }, []);

  const getHistory = useCallback((_nodeId) => {
    return [];
  }, []);

  return { addToHistory, getHistory };
};

/**
 * Versiu00f3n compatible de useFlowOptimization para FlowEditorContext
 * @param {Object} options - Opciones de configuraciu00f3n
 * @returns {Object} - API compatible con el hook anterior
 */
const useFlowOptimization = ({ throttle = 32 } = {}) => {
  // Utilizar nuestro sistema unificado de rendimiento
  const { throttledUpdatePerformance, optimizationLevel } = useAdaptivePerformance({
    lowThreshold: 30,
    mediumThreshold: 60,
    highThreshold: 100,
    monitoringInterval: throttle * 30,
  });

  // Referencia para trackear el estado de idle
  const idleStateReference = useRef({
    isIdle: false,
    lastActivityTime: Date.now(),
  });

  // Proporcionar API compatible
  return {
    // Estado
    isIdle: idleStateReference.current.isIdle,
    isUltraMode: optimizationLevel === 'ultra',

    // Métodos con nombres compatibles
    markActivity: useCallback(
      (_viewport) => {
        // Actualizar tiempo de actividad
        idleStateReference.current.lastActivityTime = Date.now();
        idleStateReference.current.isIdle = false;

        // Pasar a la función de actualización
        throttledUpdatePerformance();
      },
      [throttledUpdatePerformance],
    ),
    runOnNextFrame: useCallback((callback) => {
      requestAnimationFrame(callback);
      // Se retorna una función de cancelación no-op para mantener la compatibilidad de la API.
      return () => {
        // No-op
      };
    }, []),
    toggleUltraMode: useCallback((force) => (force === undefined ? true : force), []),
    startPerfMeasure: useCallback((name) => performance.mark(name), []),
    endPerfMeasure: useCallback((name) => {
      const endMark = `${name}-end`;
      performance.mark(endMark);
      performance.measure(name, name, endMark);
      const measures = performance.getEntriesByName(name);
      return measures[0]?.duration ?? 0;
    }, []),
    getPerfMeasures: useCallback(() => [], []),

    // Utilidades
    debounce: useCallback((function_, wait) => {
      let timeout;
      return (...arguments_) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => function_(...arguments_), wait);
      };
    }, []),
    throttle: useCallback((function_, wait) => {
      let lastTime = 0;
      return (...arguments_) => {
        const now = Date.now();
        if (now - lastTime >= wait) {
          lastTime = now;
          function_(...arguments_);
        }
      };
    }, []),
  };
};

export default useFlowOptimization;

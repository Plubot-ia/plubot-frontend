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
  const addToHistory = useCallback((nodeId, historyEntry) => {

  }, []);
  
  const getHistory = useCallback((nodeId) => {

    return [];
  }, []);
  
  return { addToHistory, getHistory };
};

/**
 * Versiu00f3n compatible de useFlowOptimization para FlowEditorContext
 * @param {Object} options - Opciones de configuraciu00f3n 
 * @returns {Object} - API compatible con el hook anterior
 */
const useFlowOptimization = ({
  enabled = true,
  throttle = 32,
  idleTimeout = 2000,
  onIdleChange = null,
} = {}) => {
  // Utilizar nuestro sistema unificado de rendimiento
  const { 
    updatePerformance, 
    throttledUpdatePerformance,
    optimizationLevel,
    fpsRef
  } = useAdaptivePerformance({
    lowThreshold: 30,
    mediumThreshold: 60,
    highThreshold: 100,
    monitoringInterval: throttle * 30
  });
  
  // Referencia para trackear el estado de idle
  const idleStateRef = useRef({ isIdle: false, lastActivityTime: Date.now() });
  
  // Proporcionar API compatible
  return {
    // Estado
    isIdle: idleStateRef.current.isIdle,
    isUltraMode: optimizationLevel === 'ultra',
    
    // Métodos con nombres compatibles
    markActivity: useCallback((viewport) => {
      // Actualizar tiempo de actividad
      idleStateRef.current.lastActivityTime = Date.now();
      idleStateRef.current.isIdle = false;
      
      // Pasar a la función de actualización
      throttledUpdatePerformance();
    }, [throttledUpdatePerformance]),
    runOnNextFrame: useCallback((callback) => {
      requestAnimationFrame(callback);
      return () => {};
    }, []),
    toggleUltraMode: useCallback((force) => force !== undefined ? force : true, []),
    startPerfMeasure: useCallback((name) => performance.mark(name), []),
    endPerfMeasure: useCallback((name) => {
      const endMark = `${name}-end`;
      performance.mark(endMark);
      performance.measure(name, name, endMark);
      const measures = performance.getEntriesByName(name);
      return measures[0]?.duration || 0;
    }, []),
    getPerfMeasures: useCallback(() => [], []),
    
    // Utilidades
    debounce: useCallback((fn, wait) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
      };
    }, []),
    throttle: useCallback((fn, wait) => {
      let lastTime = 0;
      return (...args) => {
        const now = Date.now();
        if (now - lastTime >= wait) {
          lastTime = now;
          fn(...args);
        }
      };
    }, [])
  };
};

export default useFlowOptimization;

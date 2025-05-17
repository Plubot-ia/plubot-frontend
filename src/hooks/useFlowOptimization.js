import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useThrottleFn } from 'react-use';
import { debounce } from 'lodash';

/**
 * Hook para optimizar el rendimiento del editor de flujos
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.enabled - Habilita/deshabilita la optimización
 * @param {number} options.throttle - Tiempo de throttling en ms para actualizaciones
 * @param {number} options.idleTimeout - Tiempo de inactividad antes de aplicar optimizaciones
 * @param {Function} options.onIdleChange - Callback cuando cambia el estado de inactividad
 * @returns {Object} - Estado y métodos de optimización
 */
const useFlowOptimization = ({
  enabled = true,
  throttle = 32,
  idleTimeout = 2000,
  onIdleChange = null,
} = {}) => {
  const lastInteractionTime = useRef(Date.now());
  const isIdle = useRef(false);
  const idleTimer = useRef(null);
  const animationFrame = useRef(null);
  const perfMark = useRef(0);
  const perfMeasures = useRef([]);
  const isUltraMode = useRef(false);

  // Limpiar timeouts y animation frames al desmontar
  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  /**
   * Marca actividad del usuario
   */
  const markActivity = useCallback(() => {
    if (!enabled) return;
    
    const now = Date.now();
    lastInteractionTime.current = now;
    
    // Si está inactivo, reactivar
    if (isIdle.current) {
      isIdle.current = false;
      document.body.classList.remove('performance-mode');
      if (onIdleChange) onIdleChange(false);
    }
    
    // Reiniciar el temporizador de inactividad
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      isIdle.current = true;
      document.body.classList.add('performance-mode');
      if (onIdleChange) onIdleChange(true);
    }, idleTimeout);
  }, [enabled, idleTimeout, onIdleChange]);

  /**
   * Alternar el modo de rendimiento ultra
   */
  const toggleUltraMode = useCallback((force = null) => {
    const newMode = force !== null ? force : !isUltraMode.current;
    
    if (newMode !== isUltraMode.current) {
      isUltraMode.current = newMode;
      
      if (newMode) {
        document.body.classList.add('ultra-performance-mode');
        // Aplicar optimizaciones adicionales
        applyUltraPerformanceOptimizations();
      } else {
        document.body.classList.remove('ultra-performance-mode');
        // Revertir optimizaciones
        removeUltraPerformanceOptimizations();
      }
      
      // Forzar actualización del DOM
      window.dispatchEvent(new Event('resize'));
    }
    
    return isUltraMode.current;
  }, []);

  /**
   * Aplicar optimizaciones para el modo ultra rendimiento
   */
  const applyUltraPerformanceOptimizations = useCallback(() => {
    // Reducir la precisión de los cálculos de diseño
    document.documentElement.style.setProperty('--react-flow-render-quality', '0.75');
    
    // Deshabilitar animaciones CSS
    const style = document.createElement('style');
    style.id = 'ultra-performance-styles';
    style.textContent = `
      * {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
      
      .react-flow__edge-path {
        vector-effect: non-scaling-stroke;
      }
      
      .react-flow__node {
        will-change: transform;
      }
    `;
    document.head.appendChild(style);
  }, []);

  /**
   * Eliminar optimizaciones del modo ultra rendimiento
   */
  const removeUltraPerformanceOptimizations = useCallback(() => {
    // Restaurar estilos
    document.documentElement.style.removeProperty('--react-flow-render-quality');
    
    // Eliminar estilos de optimización
    const style = document.getElementById('ultra-performance-styles');
    if (style) {
      style.remove();
    }
  }, []);

  /**
   * Ejecutar una tarea en el próximo frame de animación
   */
  const runOnNextFrame = useCallback((callback) => {
    if (!enabled || isUltraMode.current) {
      // En modo ultra rendimiento, ejecutar de inmediato
      callback();
      return () => {};
    }
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    animationFrame.current = requestAnimationFrame(() => {
      animationFrame.current = null;
      callback();
    });
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    };
  }, [enabled]);

  /**
   * Iniciar medición de rendimiento
   */
  const startPerfMeasure = useCallback((name) => {
    if (!enabled) return;
    
    const markName = `${name}-start`;
    performance.mark(markName);
    perfMark.current = markName;
  }, [enabled]);

  /**
   * Detener medición de rendimiento
   */
  const endPerfMeasure = useCallback((name) => {
    if (!enabled || !perfMark.current) return;
    
    const markName = `${name}-end`;
    performance.mark(markName);
    
    try {
      performance.measure(name, `${name}-start`, markName);
      const measures = performance.getEntriesByName(name);
      const lastMeasure = measures[measures.length - 1];
      
      // Mantener solo las últimas 10 medidas
      perfMeasures.current = [...perfMeasures.current, lastMeasure].slice(-10);
      
      return lastMeasure.duration;
    } catch (e) {
      console.warn('Error measuring performance:', e);
      return null;
    } finally {
      // Limpiar marcas
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(markName);
      performance.clearMeasures(name);
      perfMark.current = null;
    }
  }, [enabled]);

  // Versión throttled de markActivity
  const { run: throttledMarkActivity } = useThrottleFn(
    markActivity,
    throttle,
    [markActivity]
  );

  // Efecto para limpieza al desmontar
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
      }
      
      // Limpiar modo ultra rendimiento
      if (isUltraMode.current) {
        removeUltraPerformanceOptimizations();
      }
    };
  }, [removeUltraPerformanceOptimizations]);

  return {
    // Estado
    isIdle: isIdle.current,
    isUltraMode: isUltraMode.current,
    
    // Métodos
    markActivity: throttledMarkActivity,
    runOnNextFrame,
    toggleUltraMode,
    startPerfMeasure,
    endPerfMeasure,
    getPerfMeasures: () => [...perfMeasures.current],
    
    // Utilidades
    debounce: (fn, wait) => debounce(fn, wait),
    throttle: (fn, wait) => {
      let lastTime = 0;
      return (...args) => {
        const now = Date.now();
        if (now - lastTime >= wait) {
          lastTime = now;
          fn(...args);
        }
      };
    },
  };
};

export default useFlowOptimization;

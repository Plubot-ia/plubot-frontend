import { useEffect, useRef, useCallback } from 'react';
import { useThrottleFn } from 'react-use';

/**
 * Hook para optimizar el rendimiento del editor de flujos
 * @param {Object} options - Opciones de configuración
 * @param {boolean} [options.enabled=true] - Habilita/deshabilita la optimización
 * @param {number} [options.throttle=32] - Tiempo de throttling en ms para actualizaciones
 * @param {number} [options.idleTimeout=2000] - Tiempo de inactividad antes de aplicar optimizaciones
 * @returns {Object} - Estado y métodos de optimización
 */
const usePerformanceOptimization = ({
  enabled = true,
  throttle = 32,
  idleTimeout = 2000,
} = {}) => {
  const lastInteractionTime = useRef(Date.now());
  const isIdle = useRef(false);
  const idleTimer = useRef(null);
  const animationFrame = useRef(null);

  // Limpiar timeouts y animation frames al desmontar
  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  // Función para marcar actividad del usuario
  const markActivity = useCallback(() => {
    if (!enabled) return;
    
    lastInteractionTime.current = Date.now();
    
    // Si está inactivo, reactivar
    if (isIdle.current) {
      isIdle.current = false;
      // Forzar actualización del DOM
      document.body.classList.remove('performance-mode');
    }
    
    // Reiniciar el temporizador de inactividad
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      isIdle.current = true;
      document.body.classList.add('performance-mode');
    }, idleTimeout);
  }, [enabled, idleTimeout]);

  // Función para ejecutar tareas pesadas en el próximo frame de animación
  const runOnNextFrame = useCallback((callback) => {
    if (!enabled) {
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

  // Versión throttled de la función de marcado de actividad
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
    };
  }, []);

  return {
    isIdle: isIdle.current,
    markActivity: throttledMarkActivity,
    runOnNextFrame,
  };
};

export default usePerformanceOptimization;

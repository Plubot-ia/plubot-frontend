/**
 * Hook consolidado para la gestión de rendimiento en el editor de flujos
 * Este hook unifica todas las optimizaciones de rendimiento en un solo lugar:
 * - Sistema adaptativo que ajusta el nivel de optimización según la complejidad
 * - Mediciones de FPS y rendimiento
 * - Gestión de clases CSS para optimizaciones visuales
 *
 * VERSIÓN OPTIMIZADA: Se han eliminado los logs excesivos y las comprobaciones redundantes
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useStore as useZustandStore } from 'zustand';

import useFlowStore from '@/stores/use-flow-store';

import {
  measureFramePerformance,
  calculateComplexity,
  determineOptimizationLevel,
  updateMeasurementHistory,
  updatePerformanceState,
} from '../utils/adaptive-performance-utilities';

/**
 * Creates a performance updater function with all dependencies
 */
const createPerformanceUpdater = ({
  measurePerformance,
  thresholds,
  adaptiveMode,
  minFpsForAlert,
  isUltraMode,
  hasAutoOptimized,
  lastActionTime,
  measurementHistory,
  notificationsShown,
  setHasAutoOptimized,
  setOptimizationLevel,
  statsReference,
}) => {
  return (nodes = [], edges = [], currentFps) => {
    // Evitar actualizaciones muy frecuentes (throttling)
    const now = Date.now();
    if (now - lastActionTime.current < 1500) return;

    // Medir FPS si no se proporciona
    if (currentFps === undefined) {
      currentFps = measurePerformance();
    }

    // Calcular complejidad del flujo actual
    const complexity = calculateComplexity(nodes, edges, statsReference);

    // Determinar nivel de optimización recomendado
    const recommendedLevel = determineOptimizationLevel(complexity, thresholds);

    // Actualizar historial de mediciones usando helper externo
    updateMeasurementHistory(
      measurementHistory,
      { complexity, currentFps, recommendedLevel },
      {
        adaptiveMode,
        minFpsForAlert,
        isUltraMode,
      },
      { measurementHistory, hasAutoOptimized, notificationsShown },
      { setHasAutoOptimized },
    );

    // Actualizar estado final usando helper externo
    return updatePerformanceState(
      setOptimizationLevel,
      { recommendedLevel, now },
      { lastActionTime, statsReference },
    );
  };
};

/**
 * Creates a monitoring manager function
 */
const createMonitoringManager = ({
  monitoringInterval,
  monitoringTimerReference,
  updatePerformance,
}) => {
  return (nodes = [], edges = []) => {
    if (monitoringTimerReference.current) {
      clearInterval(monitoringTimerReference.current);
    }

    monitoringTimerReference.current = setInterval(() => {
      updatePerformance(nodes, edges);
    }, monitoringInterval);

    return () => {
      if (monitoringTimerReference.current) {
        clearInterval(monitoringTimerReference.current);
        monitoringTimerReference.current = undefined;
      }
    };
  };
};

/**
 * Creates performance recommendations function
 */
const createPerformanceRecommendations = (optimizationLevel, isUltraMode) => {
  return () => {
    const recommendations = [];

    if (optimizationLevel === 'high' && !isUltraMode) {
      recommendations.push('Activar el modo Ultra Rendimiento');
    }

    if (optimizationLevel === 'medium' || optimizationLevel === 'high') {
      recommendations.push(
        'Dividir el flujo en subgrafos más pequeños',
        'Evitar movimientos rápidos al trabajar con muchos nodos',
      );
    }

    return recommendations;
  };
};

/**
 * Creates adaptive system resetter function
 */
const createAdaptiveSystemResetter = ({
  measurementHistory,
  notificationsShown,
  setHasAutoOptimized,
  setOptimizationLevel,
}) => {
  return () => {
    measurementHistory.current = [];
    notificationsShown.current.clear();
    setHasAutoOptimized(false);
    setOptimizationLevel('none');
  };
};

/**
 * Creates DOM optimization effect handler
 */
const createDOMOptimizationEffect = (optimizationLevel) => {
  return () => {
    // Limpiar clases anteriores
    document.body.classList.remove(
      'optimization-none',
      'optimization-low',
      'optimization-medium',
      'optimization-high',
      'optimization-ultra',
    );

    // Aplicar clase correspondiente al nivel actual
    document.body.classList.add(`optimization-${optimizationLevel}`);

    // Con nivel alto, desactivar animaciones para mejor rendimiento
    if (optimizationLevel === 'high' || optimizationLevel === 'ultra') {
      document.body.classList.add('disable-animations');
    } else {
      document.body.classList.remove('disable-animations');
    }

    return () => {
      // Limpieza al desmontar
      document.body.classList.remove(
        'optimization-none',
        'optimization-low',
        'optimization-medium',
        'optimization-high',
        'optimization-ultra',
        'disable-animations',
      );
    };
  };
};

/**
 * Creates cleanup effect for resource management
 */
const createCleanupEffect = (monitoringTimerReference, frameTimeReference) => {
  return () => {
    // Capturar el ref value para cleanup seguro
    const currentTimer = monitoringTimerReference.current;
    return () => {
      if (currentTimer) {
        clearInterval(currentTimer);
      }
      frameTimeReference.current = [];
    };
  };
};

/**
 * Creates stats getter function
 */
const createStatsGetter = ({ frameTimeReference, measurePerformance, statsReference }) => {
  return () => {
    // Actualizar FPS si es necesario
    if (
      frameTimeReference.current.length === 0 ||
      performance.now() - frameTimeReference.current.at(-1) > 1000
    ) {
      measurePerformance();
    }

    return { ...statsReference.current };
  };
};

const useAdaptivePerformance = ({
  // UMBRALES SIMPLIFICADOS: Optimizados para un mejor balance rendimiento/calidad
  lowThreshold = 30, // Optimizaciones básicas para flujos pequeños-medianos
  mediumThreshold = 60, // Optimizaciones intermedias para flujos medianos
  highThreshold = 100, // Optimizaciones agresivas para flujos grandes
  ultraThreshold = 150, // Modo ultra para flujos extremadamente complejos
  minFpsForAlert = 25, // FPS mínimo aceptable antes de optimizaciones automáticas
  adaptiveMode = true, // Sistema adaptativo activado por defecto
  monitoringInterval = 1500, // Intervalo de monitoreo (menos frecuente para mejor rendimiento)
} = {}) => {
  // Objeto de umbrales para determinar niveles de optimización
  const thresholds = useMemo(
    () => ({
      low: lowThreshold,
      medium: mediumThreshold,
      high: highThreshold,
      ultra: ultraThreshold,
    }),
    [lowThreshold, mediumThreshold, highThreshold, ultraThreshold],
  );

  // Estado y referencias para el sistema de rendimiento unificado
  const [optimizationLevel, setOptimizationLevel] = useState('none'); // none, low, medium, high, ultra
  const [hasAutoOptimized, setHasAutoOptimized] = useState(false);
  const lastActionTime = useRef(Date.now());

  // Referencias para mediciones de rendimiento
  const monitoringTimerReference = useRef(null);
  const frameTimeReference = useRef([]);
  const fpsReference = useRef(60);
  const measurementHistory = useRef([]);
  const notificationsShown = useRef(new Set());

  // Referencias para estadísticas
  const statsReference = useRef({
    lastFps: 60,
    avgFrameTime: 16,
    complexity: 0,
    nodeCount: 0,
    edgeCount: 0,
    lastUpdateTime: Date.now(),
  });

  // Acceder al estado del store Zustand
  const isUltraMode = useZustandStore(useFlowStore, (state) => state.isUltraMode);

  // Usar helpers importados directamente para evitar redeclaraciones

  /**
   * Mide el rendimiento actual (FPS)
   */
  const measurePerformance = useCallback(() => {
    return measureFramePerformance(frameTimeReference, fpsReference, statsReference);
  }, []);

  // Create performance updater using extracted helper
  const updatePerformance = useCallback(
    (nodes = [], edges = [], currentFps) => {
      return createPerformanceUpdater({
        measurePerformance,
        thresholds,
        adaptiveMode,
        minFpsForAlert,
        isUltraMode,
        hasAutoOptimized,
        lastActionTime,
        measurementHistory,
        notificationsShown,
        setHasAutoOptimized,
        setOptimizationLevel,
        statsReference,
      })(nodes, edges, currentFps);
    },
    [adaptiveMode, minFpsForAlert, isUltraMode, measurePerformance, hasAutoOptimized, thresholds],
  );

  // Create monitoring manager using extracted helper
  const startMonitoring = useCallback(
    (nodes = [], edges = []) => {
      return createMonitoringManager({
        monitoringInterval,
        monitoringTimerReference,
        updatePerformance,
      })(nodes, edges);
    },
    [monitoringInterval, updatePerformance],
  );

  // Apply DOM optimizations using extracted helper
  useEffect(() => {
    return createDOMOptimizationEffect(optimizationLevel)();
  }, [optimizationLevel]);

  // Create performance recommendations using extracted helper
  const getPerformanceRecommendations = useCallback(() => {
    return createPerformanceRecommendations(optimizationLevel, isUltraMode)();
  }, [optimizationLevel, isUltraMode]);

  // Create adaptive system resetter using extracted helper
  const resetAdaptiveSystem = useCallback(() => {
    return createAdaptiveSystemResetter({
      measurementHistory,
      notificationsShown,
      setHasAutoOptimized,
      setOptimizationLevel,
    })();
  }, []);

  // Create stats getter using extracted helper
  const getStats = useCallback(() => {
    return createStatsGetter({
      frameTimeReference,
      measurePerformance,
      statsReference,
    })();
  }, [measurePerformance]);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return createCleanupEffect(monitoringTimerReference, frameTimeReference)();
  }, []);

  return {
    // Estado
    optimizationLevel,
    hasAutoOptimized,

    // Funciones principales
    updatePerformance,
    startMonitoring,
    measurePerformance,
    getStats,

    // Utilidades
    getPerformanceRecommendations,
    resetAdaptiveSystem,
    fpsRef: fpsReference,
  };
};

export default useAdaptivePerformance;

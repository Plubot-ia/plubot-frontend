/**
 * Hook consolidado para la gestión de rendimiento en el editor de flujos
 * Este hook unifica todas las optimizaciones de rendimiento en un solo lugar:
 * - Sistema adaptativo que ajusta el nivel de optimización según la complejidad
 * - Mediciones de FPS y rendimiento
 * - Gestión de clases CSS para optimizaciones visuales
 * 
 * VERSIÓN OPTIMIZADA: Se han eliminado los logs excesivos y las comprobaciones redundantes
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore as useZustandStore } from 'zustand';
import useFlowStore from '@/stores/useFlowStore';
import { throttle } from 'lodash';

const useAdaptivePerformance = ({
  // UMBRALES SIMPLIFICADOS: Optimizados para un mejor balance rendimiento/calidad
  lowThreshold = 30,     // Optimizaciones básicas para flujos pequeños-medianos
  mediumThreshold = 60,  // Optimizaciones intermedias para flujos medianos
  highThreshold = 100,   // Optimizaciones agresivas para flujos grandes
  ultraThreshold = 150,  // Modo ultra para flujos extremadamente complejos
  minFpsForAlert = 25,   // FPS mínimo aceptable antes de optimizaciones automáticas
  adaptiveMode = true,   // Sistema adaptativo activado por defecto
  monitoringInterval = 1500  // Intervalo de monitoreo (menos frecuente para mejor rendimiento)
} = {}) => {
  // Estado y referencias para el sistema de rendimiento unificado
  const [optimizationLevel, setOptimizationLevel] = useState('none'); // none, low, medium, high, ultra
  const [hasAutoOptimized, setHasAutoOptimized] = useState(false);
  
  // Referencias para mediciones de rendimiento
  const lastActionTime = useRef(Date.now());
  const monitoringTimerRef = useRef(null);
  const frameTimeRef = useRef([]);
  const fpsRef = useRef(60);
  const measurementHistory = useRef([]);
  const notificationsShown = useRef(new Set());
  
  // Referencias para estadísticas
  const statsRef = useRef({
    lastFps: 60,
    avgFrameTime: 16,
    complexity: 0,
    nodeCount: 0,
    edgeCount: 0,
    lastUpdateTime: Date.now()
  });

  // Acceder al estado del store Zustand
  const isUltraMode = useZustandStore(useFlowStore, state => state.isUltraMode);
  const toggleUltraMode = useZustandStore(useFlowStore, state => state.toggleUltraMode);

  /**
   * Calcula el nivel de complejidad del flujo basado en nodos y aristas
   * Usa una métrica ponderada donde las aristas tienen menor peso que los nodos
   */
  const calculateComplexity = useCallback((nodes = [], edges = []) => {
    if (!nodes || !edges) return 0;
    
    // Las aristas tienen un impacto en rendimiento menor que los nodos (ponderación 0.6)
    // Se consideran factores adicionales como tipos de nodos y anidamiento
    let complexity = nodes.length + (edges.length * 0.6);
    
    // Factor adicional para tipos de nodos complejos (decisión, acción)
    const complexNodeCount = nodes.filter(n => 
      n.type === 'decisionNode' || n.type === 'actionNode' || n.type === 'httpRequestNode'
    ).length;
    
    // Penalización por nodos complejos
    complexity += complexNodeCount * 0.3;
    
    // Actualizar estadísticas
    statsRef.current.complexity = complexity;
    statsRef.current.nodeCount = nodes.length;
    statsRef.current.edgeCount = edges.length;
    
    return complexity;
  }, []);

  /**
   * Determina qué nivel de optimización activar basado en la complejidad
   */
  const determineOptimizationLevel = useCallback((complexity) => {
    if (complexity >= ultraThreshold) return 'ultra';
    if (complexity >= highThreshold) return 'high';
    if (complexity >= mediumThreshold) return 'medium';
    if (complexity >= lowThreshold) return 'low';
    return 'none'; 
  }, [lowThreshold, mediumThreshold, highThreshold, ultraThreshold]);

  /**
   * Mide el rendimiento actual (FPS)
   */
  const measurePerformance = useCallback(() => {
    const now = performance.now();
    const frameTimes = frameTimeRef.current;
    
    if (frameTimes.length > 0) {
      const lastFrameTime = frameTimes[frameTimes.length - 1];
      const frameTime = now - lastFrameTime;
      
      // Añadir tiempo actual y mantener solo los últimos 30 frames
      frameTimes.push(now);
      if (frameTimes.length > 30) frameTimes.shift();
      
      // Calcular FPS promedio con los últimos frames
      if (frameTimes.length > 5) {
        // Calcular diferencias de tiempo entre frames consecutivos
        const frameDurations = [];
        for (let i = 1; i < frameTimes.length; i++) {
          frameDurations.push(frameTimes[i] - frameTimes[i-1]);
        }
        
        // Calcular tiempo promedio por frame y FPS
        const avgFrameTime = frameDurations.reduce((sum, time) => sum + time, 0) / frameDurations.length;
        const fps = Math.round(1000 / avgFrameTime);
        
        // Actualizar estadísticas
        fpsRef.current = fps;
        statsRef.current.lastFps = fps;
        statsRef.current.avgFrameTime = avgFrameTime.toFixed(2);
      }
    } else {
      // Primera medición
      frameTimes.push(now);
    }
    
    return fpsRef.current;
  }, []);

  /**
   * Actualiza el rendimiento basado en la complejidad y el FPS actual
   * @param {Array} nodes - Array de nodos del flujo
   * @param {Array} edges - Array de aristas del flujo
   * @param {number} currentFps - FPS actuales del sistema (opcional)
   */
  const updatePerformance = useCallback((nodes = [], edges = [], currentFps) => {
    // Evitar actualizaciones muy frecuentes (throttling)
    const now = Date.now();
    if (now - lastActionTime.current < 1500) return;
    
    // Medir FPS si no se proporciona
    if (currentFps === undefined) {
      currentFps = measurePerformance();
    }
    
    // Calcular complejidad del flujo actual
    const complexity = calculateComplexity(nodes, edges);
    
    // Determinar nivel de optimización recomendado
    const recommendedLevel = determineOptimizationLevel(complexity);
    
    // Registrar medición para análisis (solo si es significativamente diferente)
    const lastMeasurement = measurementHistory.current[measurementHistory.current.length - 1];
    const significantChange = !lastMeasurement || 
      Math.abs(lastMeasurement.complexity - complexity) > 5 ||
      Math.abs(lastMeasurement.fps - currentFps) > 5;
      
    if (significantChange) {
      measurementHistory.current.push({
        timestamp: now,
        complexity,
        fps: currentFps,
        level: recommendedLevel
      });
      
      // Mantener solo las últimas 5 mediciones significativas
      if (measurementHistory.current.length > 5) {
        measurementHistory.current.shift();
      }
    }
    
    // Análisis de tendencia de rendimiento - solo cuando el rendimiento es bajo
    if (adaptiveMode && currentFps < minFpsForAlert && recommendedLevel !== 'ultra' && !isUltraMode) {
      // Si el rendimiento es consistentemente malo (2+ mediciones seguidas)
      const recentMeasurements = measurementHistory.current.slice(-2);
      const allLowFps = recentMeasurements.length >= 2 && recentMeasurements.every(m => m.fps < minFpsForAlert);
      
      if (allLowFps && !hasAutoOptimized) {
        // Activar automáticamente el modo ultra rendimiento - solo un mensaje de notificación
        if (!isUltraMode && !notificationsShown.current.has('auto-ultra')) {
          // toggleUltraMode(); // COMENTADO: Evitar activación automática completa
          setHasAutoOptimized(true);
          notificationsShown.current.add('auto-ultra');
        }
      }
    }
    
    // Actualizar nivel de optimización
    setOptimizationLevel(recommendedLevel);
    lastActionTime.current = now;
    statsRef.current.lastUpdateTime = now;
    
    return recommendedLevel;
  }, [calculateComplexity, determineOptimizationLevel, adaptiveMode, minFpsForAlert, isUltraMode, measurePerformance]);
  
  /**
   * Inicia el monitoreo continuo del rendimiento
   */
  const startMonitoring = useCallback((nodes = [], edges = []) => {
    // Limpiar timer existente si hay uno
    if (monitoringTimerRef.current) {
      clearInterval(monitoringTimerRef.current);
    }
    
    // Solo monitorear si hay suficientes elementos o estamos en modo adaptativo
    if ((nodes.length < 10 && edges.length < 15) && !adaptiveMode) {
      return () => {};
    }
    
    // Actualizar rendimiento inicial
    updatePerformance(nodes, edges);
    
    // Establecer intervalo para monitoreo periódico
    monitoringTimerRef.current = setInterval(() => {
      // Factor de complejidad actual
      const complexity = statsRef.current.complexity;
      
      // Throttling inteligente - reducir frecuencia cuando hay muchos elementos
      if (complexity > 100 && Math.random() < 0.7) return;
      
      // Medir rendimiento y actualizar optimizaciones
      const currentFps = measurePerformance();
      updatePerformance(nodes, edges, currentFps);
      
    }, monitoringInterval);
    
    return () => {
      if (monitoringTimerRef.current) {
        clearInterval(monitoringTimerRef.current);
      }
    };
  }, [monitoringInterval, adaptiveMode, updatePerformance, measurePerformance]);

  /**
   * Aplicar automáticamente optimizaciones al DOM basadas en el nivel
   */
  useEffect(() => {
    // Limpiar clases anteriores
    document.body.classList.remove(
      'optimization-none',
      'optimization-low', 
      'optimization-medium', 
      'optimization-high',
      'optimization-ultra'
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
        'disable-animations'
      );
    };
  }, [optimizationLevel]);
  
  /**
   * Proporciona recomendaciones para mejorar el rendimiento
   */
  const getPerformanceRecommendations = useCallback(() => {
    const recommendations = [];
    
    if (optimizationLevel === 'high' && !isUltraMode) {
      recommendations.push('Activar el modo Ultra Rendimiento');
    }
    
    if (optimizationLevel === 'medium' || optimizationLevel === 'high') {
      recommendations.push('Dividir el flujo en subgrafos más pequeños');
      recommendations.push('Evitar movimientos rápidos al trabajar con muchos nodos');
    }
    
    return recommendations;
  }, [optimizationLevel, isUltraMode]);

  /**
   * Limpia la memoria del sistema adaptativo
   */
  const resetAdaptiveSystem = useCallback(() => {
    measurementHistory.current = [];
    notificationsShown.current.clear();
    setHasAutoOptimized(false);
    setOptimizationLevel('none');
  }, []);

  /**
   * Obtiene las estadísticas actuales del sistema
   */
  const getStats = useCallback(() => {
    // Actualizar FPS si es necesario
    if (frameTimeRef.current.length === 0 || 
        performance.now() - frameTimeRef.current[frameTimeRef.current.length - 1] > 1000) {
      measurePerformance();
    }
    
    return { ...statsRef.current };
  }, [measurePerformance]);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (monitoringTimerRef.current) {
        clearInterval(monitoringTimerRef.current);
      }
      frameTimeRef.current = [];
    };
  }, []);

  // Aplicar el throttling a la función de actualización para casos de uso frecuente
  const throttledUpdatePerformance = throttle(updatePerformance, 1000);

  return {
    // Estado
    optimizationLevel,
    hasAutoOptimized,
    
    // Funciones principales
    updatePerformance,
    throttledUpdatePerformance,
    startMonitoring,
    measurePerformance,
    getStats,
    
    // Utilidades
    getPerformanceRecommendations,
    resetAdaptiveSystem,
    fpsRef
  };
};

export default useAdaptivePerformance;

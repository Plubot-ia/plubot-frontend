/**
 * @file adaptive-performance-utilities.js
 * @description Utilidades para gestión de rendimiento adaptativo en el editor de flujo
 * Extraído de useAdaptivePerformance.js para reducir max-lines-per-function
 */

// Helper: Calcular duraciones entre frames consecutivos
const calculateFrameDurations = (frameTimes) => {
  const frameDurations = [];
  for (let index = 1; index < frameTimes.length; index++) {
    const hasCurrentFrame = Object.prototype.hasOwnProperty.call(frameTimes, index);
    const hasPreviousFrame = Object.prototype.hasOwnProperty.call(frameTimes, index - 1);

    if (hasCurrentFrame && hasPreviousFrame) {
      const currentFrame = frameTimes[Math.max(0, Math.min(index, frameTimes.length - 1))]; // Sanitized index
      const previousFrame = frameTimes[index - 1];
      frameDurations.push(currentFrame - previousFrame);
    }
  }
  return frameDurations;
};

// Helper: Calcular FPS promedio a partir de duraciones
const calculateAverageFPS = (frameDurations) => {
  const avgFrameTime = frameDurations.reduce((sum, time) => sum + time, 0) / frameDurations.length;
  return {
    fps: Math.round(1000 / avgFrameTime),
    avgFrameTime: avgFrameTime.toFixed(2),
  };
};

// Helper: Actualizar estadísticas de rendimiento
const updatePerformanceStats = ({ references, metrics }) => {
  const { fpsReference, statsReference } = references;
  const { fps, avgFrameTime } = metrics;

  fpsReference.current = fps;
  statsReference.current.lastFps = fps;
  statsReference.current.avgFrameTime = avgFrameTime;
};

// Helper: Mantener límite de frames en historial
const maintainFrameHistoryLimit = (frameTimes, maxFrames = 30) => {
  if (frameTimes.length > maxFrames) {
    frameTimes.shift();
  }
};

/**
 * Helper para medir rendimiento de frames y calcular FPS
 * @param {Object} frameTimeReference - Referencia a array de tiempos de frame
 * @param {Object} fpsReference - Referencia a FPS actual
 * @param {Object} statsReference - Referencia a estadísticas
 * @returns {number} FPS actual calculado
 */
export function measureFramePerformance(frameTimeReference, fpsReference, statsReference) {
  const now = performance.now();
  const frameTimes = frameTimeReference.current;

  if (frameTimes.length > 0) {
    // Añadir tiempo actual y mantener solo los últimos 30 frames
    frameTimes.push(now);
    maintainFrameHistoryLimit(frameTimes);

    // Calcular FPS promedio con los últimos frames
    if (frameTimes.length > 5) {
      const frameDurations = calculateFrameDurations(frameTimes);
      const { fps, avgFrameTime } = calculateAverageFPS(frameDurations);
      updatePerformanceStats({
        references: { fpsReference, statsReference },
        metrics: { fps, avgFrameTime },
      });
    }
  } else {
    // Primera medición
    frameTimes.push(now);
  }

  return fpsReference.current;
}

/**
 * Helper para analizar tendencias de rendimiento y activar optimizaciones automáticas
 * @param {Object} thresholds - Umbrales de rendimiento
 * @param {Object} measurementHistory - Historial de mediciones
 * @param {Object} notificationsShown - Notificaciones mostradas
 * @param {Function} setHasAutoOptimized - Setter para auto-optimización
 * @returns {boolean} Si se realizó optimización automática
 */
export function analyzePerformanceTrend(
  { adaptiveMode, currentFps, minFpsForAlert, recommendedLevel, isUltraMode },
  { measurementHistory, hasAutoOptimized, notificationsShown },
  { setHasAutoOptimized },
) {
  // Análisis de tendencia de rendimiento - solo cuando el rendimiento es bajo
  if (adaptiveMode && currentFps < minFpsForAlert && recommendedLevel !== 'ultra' && !isUltraMode) {
    // Si el rendimiento es consistentemente malo (2+ mediciones seguidas)
    const recentMeasurements = measurementHistory.current.slice(-2);
    const allLowFps =
      recentMeasurements.length >= 2 && recentMeasurements.every((m) => m.fps < minFpsForAlert);

    if (
      allLowFps &&
      !hasAutoOptimized && // Activar automáticamente el modo ultra rendimiento - solo un mensaje de notificación
      !notificationsShown.current.has('auto-ultra')
    ) {
      // toggleUltraMode(); // COMENTADO: Evitar activación automática completa
      setHasAutoOptimized(true);
      notificationsShown.current.add('auto-ultra');
      return true;
    }
  }
  return false;
}

// Helper: Validar arrays de entrada
const validateInputArrays = (nodes, edges) => {
  return {
    validNodes: nodes && Array.isArray(nodes) ? nodes : [],
    validEdges: edges && Array.isArray(edges) ? edges : [],
  };
};

// Helper: Calcular complejidad base de nodos y aristas
const calculateBaseComplexity = (nodeCount, edgeCount) => {
  // Las aristas tienen un impacto en rendimiento menor que los nodos (ponderación 0.6)
  return nodeCount + edgeCount * 0.6;
};

// Helper: Contar nodos complejos
const countComplexNodes = (nodes) => {
  const complexTypes = new Set(['decisionNode', 'actionNode', 'httpRequestNode']);
  return nodes.filter((node) => complexTypes.has(node.type)).length;
};

// Helper: Actualizar estadísticas de complejidad
const updateComplexityStats = ({ statsReference, metrics }) => {
  const { complexity, nodeCount, edgeCount } = metrics;

  if (statsReference?.current) {
    statsReference.current.complexity = complexity;
    statsReference.current.nodeCount = nodeCount;
    statsReference.current.edgeCount = edgeCount;
  }
};

/**
 * Helper para calcular la complejidad del flujo basado en nodos y aristas
 * @param {Array} nodes - Array de nodos del flujo
 * @param {Array} edges - Array de aristas del flujo
 * @param {Object} statsReference - Referencia a estadísticas
 * @returns {number} Nivel de complejidad calculado
 */
export function calculateComplexity(nodes = [], edges = [], statsReference) {
  if (!nodes || !edges) return 0;

  const { validNodes, validEdges } = validateInputArrays(nodes, edges);
  const baseComplexity = calculateBaseComplexity(validNodes.length, validEdges.length);
  const complexNodeCount = countComplexNodes(validNodes);

  // Penalización por nodos complejos
  const finalComplexity = baseComplexity + complexNodeCount * 0.3;

  updateComplexityStats({
    statsReference,
    metrics: {
      complexity: finalComplexity,
      nodeCount: validNodes.length,
      edgeCount: validEdges.length,
    },
  });
  return finalComplexity;
}

/**
 * Helper para determinar qué nivel de optimización activar basado en la complejidad
 * @param {number} complexity - Complejidad calculada
 * @param {Object} thresholds - Umbrales de optimización
 * @returns {string} Nivel de optimización recomendado
 */
export function determineOptimizationLevel(complexity, thresholds) {
  const { low, medium, high, ultra } = thresholds;
  if (complexity >= ultra) return 'ultra';
  if (complexity >= high) return 'high';
  if (complexity >= medium) return 'medium';
  if (complexity >= low) return 'low';
  return 'none';
}

/**
 * Helper para actualizar el historial de mediciones de rendimiento
 * Solo registra cambios significativos para evitar ruido en los datos
 * @param {Object} measurementHistory - Historial de mediciones
 * @param {Object} metrics - Métricas actuales
 * @param {number} timestamp - Timestamp actual
 * @returns {boolean} Si se registró un cambio significativo
 */
export function updateMeasurementHistory(measurementHistory, metrics, timestamp) {
  const { complexity, currentFps, recommendedLevel } = metrics;

  // Registrar medición para análisis (solo si es significativamente diferente)
  const lastMeasurement = measurementHistory.current.at(-1);
  const significantChange =
    !lastMeasurement ||
    Math.abs(lastMeasurement.complexity - complexity) > 5 ||
    Math.abs(lastMeasurement.fps - currentFps) > 5;

  if (significantChange) {
    measurementHistory.current.push({
      timestamp,
      complexity,
      fps: currentFps,
      level: recommendedLevel,
    });

    // Mantener solo las últimas 5 mediciones significativas
    if (measurementHistory.current.length > 5) {
      measurementHistory.current.shift();
    }
  }

  return significantChange;
}

/**
 * Helper para actualizar el estado final tras análisis de rendimiento
 * Centraliza la actualización de referencias y estado
 * @param {Function} setOptimizationLevel - Setter para nivel de optimización
 * @param {Object} state - Estado actual
 * @param {Object} references - Referencias
 * @returns {string} Nivel de optimización recomendado
 */
export function updatePerformanceState(setOptimizationLevel, state, references) {
  const { recommendedLevel, now } = state;
  const { lastActionTime, statsReference } = references;

  // Actualizar nivel de optimización
  setOptimizationLevel(recommendedLevel);
  lastActionTime.current = now;
  statsReference.current.lastUpdateTime = now;

  return recommendedLevel;
}

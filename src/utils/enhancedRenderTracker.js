/**
 * enhancedRenderTracker.js - Sistema avanzado de tracking con categorización jerárquica
 * Versión mejorada del renderTracker con organización por categorías y métricas avanzadas
 */

import React from 'react';

import { renderTrack, info, isEnabled, performance } from './developmentLogger';

// Categorías de componentes para organización jerárquica - REORGANIZADO
const COMPONENT_CATEGORIES = {
  // === NODOS (todos los tipos de nodos del flujo) ===
  NODES: {
    name: '🔷 Nodos',
    icon: '🔷',
    components: [
      // Nodos de flujo básicos
      'StartNode',
      'EndNode',
      'MessageNode',
      'DecisionNode',
      'ConditionNode',
      'OptionNode',
      'InputNode',
      // Nodos IA
      'AiNode',
      'AiNodePro',
      'EmotionDetectionNode',
      'PowerNode',
      // Nodos de integración
      'ApiNode',
      'HttpRequestNode',
      'WebhookNode',
      'DatabaseNode',
      'DiscordNode',
      'WaitNode',
      // Nodos multimedia
      'MediaNode',
      'ActionNode',
      'MemoryNode',
    ],
  },

  // === COMPONENTES UI (elementos visuales de la interfaz) ===
  UI_COMPONENTS: {
    name: '🎨 Componentes UI',
    icon: '🎨',
    components: [
      'NodePalette',
      'CustomMiniMap',
      'BackgroundScene',
      'EpicHeader',
      'ByteAssistant',
      'StatusBubble',
      'PerformanceMonitor',
      'RealTimePerformanceMonitor',
      'EnhancedPerformanceMonitor',
    ],
  },

  // === CONEXIONES (edges y líneas de flujo) ===
  CONNECTIONS: {
    name: '🔗 Conexiones',
    icon: '🔗',
    components: ['EliteEdge', 'CustomEdge', 'AnimatedEdge', 'SmartEdge', 'ConnectionLine'],
  },

  // === EDITOR (componentes principales del editor de flujo) ===
  EDITOR: {
    name: '📝 Editor',
    icon: '📝',
    components: [
      'FlowEditor',
      'FlowMain',
      'ReactFlow',
      'FlowProvider',
      'FlowRenderer',
      'EmergencyRecovery',
    ],
  },

  // === SIMULADOR (componentes de simulación y entrenamiento) ===
  SIMULATOR: {
    name: '🚀 Simulador',
    icon: '🚀',
    components: [
      'TrainingScreen',
      'SimulatorMode',
      'TrainingProvider',
      'SimulationEngine',
      'TestRunner',
    ],
  },

  // === OTROS (handles, stores, hooks, utilidades) ===
  OTHERS: {
    name: '📦 Otros',
    icon: '📦',
    components: [
      // Handles
      'OptionNodeHandle',
      'CustomHandle',
      'SmartHandle',
      // Subcomponentes
      'OptionNodeIcon',
      'OptionNodeContent',
      'NodeToolbar',
      'NodeResizer',
      'NodeControls',
      // Stores & Hooks
      'useFlowStore',
      'useNodeData',
      'useReactFlow',
      'useKeyPress',
      'useDebounce',
      // Utilidades
      'VariableEditor',
      'CodeEditor',
      'JsonEditor',
      'MarkdownEditor',
      'ColorPicker',
    ],
  },
};

// Métricas avanzadas por categoría
class CategoryMetrics {
  constructor() {
    this.metrics = new Map();
  }

  update(category, componentName, _renderData) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, {
        totalRenders: 0,
        components: new Set(),
        avgRenderRate: 0,
        efficiency: 'EXCELLENT',
        lastUpdate: Date.now(),
      });
    }

    const catMetrics = this.metrics.get(category);
    catMetrics.totalRenders += 1;
    catMetrics.components.add(componentName);
    catMetrics.lastUpdate = Date.now();
  }

  getCategoryStats(category) {
    return this.metrics.get(category) ?? undefined;
  }

  getAllCategoryStats() {
    const stats = {};
    for (const [category, metrics] of this.metrics) {
      Object.assign(stats, {
        [category]: {
          ...metrics,
          components: [...metrics.components],
        },
      });
    }
    return stats;
  }
}

class EnhancedRenderTracker {
  constructor() {
    this.renders = new Map();
    this.startTime = Date.now();
    this.logLimit = new Map();
    this.reportInterval = undefined;
    this.silencedComponents = new Set();
    this.categoryMetrics = new CategoryMetrics();
    this.componentCategories = new Map(); // Mapeo rápido componente -> categoría
    this.performanceThresholds = {
      EXCELLENT: 1,
      GOOD: 2,
      NEEDS_ATTENTION: 5,
      POOR: 10,
    };
    this.initializeCategoryMapping();
  }

  initializeCategoryMapping() {
    // Crear mapeo inverso para búsqueda rápida
    for (const [categoryKey, category] of Object.entries(COMPONENT_CATEGORIES)) {
      for (const component of category.components) {
        this.componentCategories.set(component, categoryKey);
      }
    }
  }

  detectNodeCategory(lowerName) {
    if (lowerName.includes('ai') || lowerName.includes('emotion') || lowerName.includes('power')) {
      return 'AI_NODES';
    }
    if (
      lowerName.includes('api') ||
      lowerName.includes('http') ||
      lowerName.includes('webhook') ||
      lowerName.includes('discord') ||
      lowerName.includes('database')
    ) {
      return 'INTEGRATION_NODES';
    }
    if (
      lowerName.includes('media') ||
      lowerName.includes('action') ||
      lowerName.includes('memory')
    ) {
      return 'MEDIA_NODES';
    }
    return 'FLOW_NODES';
  }

  detectGeneralCategory(lowerName) {
    if (lowerName.includes('edge')) return 'EDGES';
    if (lowerName.includes('handle')) return 'HANDLES';
    if (lowerName.includes('store') || lowerName.includes('use')) return 'STORES';
    if (lowerName.includes('editor') || lowerName.includes('picker')) return 'UTILITIES';
    return 'UI_COMPONENTS';
  }

  getComponentCategory(componentName) {
    // Buscar categoría directa
    if (this.componentCategories.has(componentName)) {
      return this.componentCategories.get(componentName);
    }

    // Intentar detectar categoría por patrones en el nombre
    const lowerName = componentName.toLowerCase();

    if (lowerName.includes('node')) {
      return this.detectNodeCategory(lowerName);
    }

    return this.detectGeneralCategory(lowerName);
  }

  track(componentName, reason = 'unknown', metadata = {}) {
    const now = Date.now();
    const category = this.getComponentCategory(componentName);

    if (!this.renders.has(componentName)) {
      this.renders.set(componentName, {
        count: 0,
        category,
        firstRender: now,
        lastRender: now,
        reasons: new Map(),
        renderTimes: [],
        metadata: {},
        performanceScore: 100, // Puntuación inicial
      });
    }

    const componentData = this.renders.get(componentName);
    componentData.count++;
    componentData.lastRender = now;
    componentData.renderTimes.push(now);
    componentData.metadata = { ...componentData.metadata, ...metadata };

    // Actualizar métricas de categoría
    this.categoryMetrics.update(category, componentName, componentData);

    // Track reasons
    if (!componentData.reasons.has(reason)) {
      componentData.reasons.set(reason, 0);
    }
    componentData.reasons.set(reason, componentData.reasons.get(reason) + 1);

    // Calcular puntuación de performance
    this.updatePerformanceScore(componentName, componentData);

    // Log con límite para evitar spam (solo si no está silenciado)
    if (!this.silencedComponents.has(componentName)) {
      const logKey = `${componentName}-${reason}`;
      const currentLogs = this.logLimit.get(logKey) ?? 0;

      if (currentLogs < 5) {
        let categoryName = 'Unknown';
        const categoryEntry = Object.entries(COMPONENT_CATEGORIES).find(
          ([key]) => key === category,
        );
        if (categoryEntry) {
          const [, categoryData] = categoryEntry;
          if (categoryData && categoryData.name) {
            categoryName = categoryData.name;
          }
        }
        renderTrack(componentName, reason, {
          count: currentLogs + 1,
          category: categoryName,
          score: componentData.performanceScore,
        });
        this.logLimit.set(logKey, currentLogs + 1);
      }
    }
  }

  updatePerformanceScore(componentName, componentData) {
    // FIX: Use sliding window for consistent calculation
    const now = Date.now();
    const windowMs = 5000; // 5 second window
    const recentRenders = componentData.renderTimes.filter((time) => now - time <= windowMs);
    const rendersPerSecond =
      recentRenders.length > 0
        ? recentRenders.length / (windowMs / 1000)
        : componentData.count / ((now - this.startTime) / 1000);

    // Calcular puntuación basada en renders por segundo
    let score = 100;
    if (rendersPerSecond > this.performanceThresholds.POOR) {
      score = 25;
    } else if (rendersPerSecond > this.performanceThresholds.NEEDS_ATTENTION) {
      score = 50;
    } else if (rendersPerSecond > this.performanceThresholds.GOOD) {
      score = 75;
    }

    // Penalizar por razones problemáticas
    const problematicReasons = new Set(['unnecessary', 'props-change', 'parent-render']);
    for (const [reason, count] of componentData.reasons) {
      if (problematicReasons.has(reason) && count > 10) {
        score -= 10;
      }
    }

    componentData.performanceScore = Math.max(0, Math.min(100, score));
  }

  getStats(componentName) {
    const data = this.renders.get(componentName);
    if (!data) return;

    // FIX: Calculate renders/s using sliding window (last 5 seconds)
    const now = Date.now();
    const windowMs = 5000; // 5 second window
    const recentRenders = data.renderTimes.filter((time) => now - time <= windowMs);
    const rendersPerSecond =
      recentRenders.length > 0
        ? (recentRenders.length / (windowMs / 1000)).toFixed(2)
        : (data.count / ((now - this.startTime) / 1000)).toFixed(2);

    const avgTimeBetweenRenders =
      data.renderTimes.length > 1
        ? (data.renderTimes.at(-1) - data.renderTimes[0]) / (data.renderTimes.length - 1)
        : 0;

    return {
      component: componentName,
      category: data.category,
      categoryName: COMPONENT_CATEGORIES[data.category]?.name || 'Unknown',
      totalRenders: data.count,
      rendersPerSecond: Number.parseFloat(rendersPerSecond),
      avgTimeBetweenRenders: Math.round(avgTimeBetweenRenders),
      reasons: Object.fromEntries(data.reasons),
      efficiency: this.calculateEfficiency(Number.parseFloat(rendersPerSecond)),
      performanceScore: data.performanceScore,
      metadata: data.metadata,
    };
  }

  calculateEfficiency(rendersPerSecond) {
    if (rendersPerSecond < this.performanceThresholds.EXCELLENT) return 'EXCELLENT';
    if (rendersPerSecond < this.performanceThresholds.GOOD) return 'GOOD';
    if (rendersPerSecond < this.performanceThresholds.NEEDS_ATTENTION) return 'NEEDS_ATTENTION';
    return 'POOR';
  }

  getAllStats() {
    const stats = [];
    for (const componentName of this.renders.keys()) {
      const stat = this.getStats(componentName);
      if (stat) stats.push(stat);
    }
    return stats.sort((a, b) => b.rendersPerSecond - a.rendersPerSecond);
  }

  getStatsByCategory() {
    const statsByCategory = {};

    for (const [categoryKey, category] of Object.entries(COMPONENT_CATEGORIES)) {
      Object.assign(statsByCategory, {
        [categoryKey]: {
          name: category.name,
          icon: category.icon,
          components: [],
          totalRenders: 0,
          avgRenderRate: 0,
          efficiency: 'EXCELLENT',
        },
      });
    }

    const allStats = this.getAllStats();

    for (const stat of allStats) {
      const { category } = stat;
      if (Object.prototype.hasOwnProperty.call(statsByCategory, category)) {
        const categoryStats = { ...statsByCategory };
        const categoryEntry = Object.entries(categoryStats).find(([key]) => key === category);
        const categoryData = categoryEntry ? categoryEntry[1] : undefined;
        if (categoryData) {
          categoryData.components.push(stat);
          categoryData.totalRenders += stat.totalRenders;
          categoryData.avgRenderRate = (
            categoryData.totalRenders / categoryData.components.length
          ).toFixed(2);
        }
      }
    }

    // Calcular promedios y eficiencia por categoría
    for (const category of Object.values(statsByCategory)) {
      if (category.components.length > 0) {
        const avgRate =
          category.components.reduce((sum, c) => sum + c.rendersPerSecond, 0) /
          category.components.length;
        category.avgRenderRate = avgRate.toFixed(2);
        category.efficiency = this.calculateEfficiency(avgRate);
      }
    }

    return statsByCategory;
  }

  generateDetailedReport() {
    const stats = this.getAllStats();
    const categoryStats = this.getStatsByCategory();
    const totalTime = (Date.now() - this.startTime) / 1000;

    const report = {
      summary: {
        trackingTime: totalTime.toFixed(1),
        totalComponents: stats.length,
        totalCategories: Object.keys(categoryStats).length,
        overallHealth: this.calculateOverallHealth(stats),
      },
      categories: categoryStats,
      topOffenders: stats
        .filter((s) => s.efficiency === 'POOR' || s.efficiency === 'NEEDS_ATTENTION')
        .slice(0, 5),
      bestPerformers: stats.filter((s) => s.efficiency === 'EXCELLENT').slice(0, 5),
      recommendations: this.generateRecommendations(stats, categoryStats),
    };

    if (isEnabled('performance')) {
      this.logDetailedReport(report);
    }

    return report;
  }

  calculateOverallHealth(stats) {
    if (stats.length === 0) return 'NO_DATA';

    const scores = stats.map((s) => s.performanceScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    if (avgScore >= 90) return 'EXCELLENT';
    if (avgScore >= 75) return 'GOOD';
    if (avgScore >= 50) return 'NEEDS_ATTENTION';
    return 'POOR';
  }

  generateRecommendations(stats, categoryStats) {
    const recommendations = [];

    // Recomendar optimización para componentes con mal rendimiento
    const poorPerformers = stats.filter((s) => s.efficiency === 'POOR');
    if (poorPerformers.length > 0) {
      recommendations.push({
        type: 'CRITICAL',
        message: `${poorPerformers.length} componentes requieren optimización urgente`,
        components: poorPerformers.map((p) => p.component),
        action: 'Implementar React.memo, useCallback y useMemo',
      });
    }

    // Recomendar revisión de categorías problemáticas
    for (const [_key, category] of Object.entries(categoryStats)) {
      if (category.efficiency === 'NEEDS_ATTENTION' || category.efficiency === 'POOR') {
        recommendations.push({
          type: 'WARNING',
          message: `La categoría "${category.name}" tiene problemas de rendimiento`,
          avgRenderRate: category.avgRenderRate,
          action: 'Revisar arquitectura y flujo de datos',
        });
      }
    }

    return recommendations;
  }

  logDetailedReport(report) {
    performance('📊 ENHANCED RENDER PERFORMANCE REPORT');
    performance(`⏱️ Tracking time: ${report.summary.trackingTime}s`);
    performance(`📈 Total components: ${report.summary.totalComponents}`);
    performance(`🏷️ Categories tracked: ${report.summary.totalCategories}`);
    performance(`💚 Overall health: ${report.summary.overallHealth}`);

    // Log por categorías
    performance('\n📂 PERFORMANCE BY CATEGORY:');
    for (const [_key, category] of Object.entries(report.categories)) {
      if (category.components.length > 0) {
        performance(`${category.icon} ${category.name}: ${category.efficiency}`);
        performance(
          `   Components: ${category.components.length}, Avg rate: ${category.avgRenderRate}/s`,
        );
      }
    }

    // Log recomendaciones
    if (report.recommendations.length > 0) {
      performance('\n💡 RECOMMENDATIONS:');
      for (const rec of report.recommendations) {
        performance(`[${rec.type}] ${rec.message}`);
        if (rec.action) {
          performance(`   Action: ${rec.action}`);
        }
      }
    }
  }

  // Métodos de compatibilidad con el sistema anterior
  startAutoReporting(intervalMs = 10_000) {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }

    this.reportInterval = setInterval(() => {
      this.generateDetailedReport();
    }, intervalMs);
  }

  stopAutoReporting() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = undefined;
    }
  }

  reset() {
    this.renders.clear();
    this.logLimit.clear();
    this.categoryMetrics = new CategoryMetrics();
    this.startTime = Date.now();
  }

  silenceComponent(componentName) {
    this.silencedComponents.add(componentName);
    info(`${componentName} render logging silenced`);
  }

  unsilenceComponent(componentName) {
    this.silencedComponents.delete(componentName);
    info(`${componentName} render logging enabled`);
  }

  silenceWellOptimizedComponents() {
    const wellOptimized = [
      'BackgroundScene',
      'CustomMiniMap',
      // Agregar más componentes bien optimizados aquí
    ];

    for (const component of wellOptimized) {
      this.silenceComponent(component);
    }
  }

  getSilencedComponents() {
    return [...this.silencedComponents];
  }

  // Nuevo método para exportar configuración de categorías
  getCategories() {
    return { ...COMPONENT_CATEGORIES };
  }

  // Método para agregar componentes a categorías dinámicamente
  registerComponent(componentName, category) {
    if (Object.prototype.hasOwnProperty.call(COMPONENT_CATEGORIES, category)) {
      const categoryEntry = Object.entries(COMPONENT_CATEGORIES).find(([key]) => key === category);
      if (categoryEntry) {
        const [, categoryData] = categoryEntry;
        if (categoryData && categoryData.components) {
          categoryData.components.push(componentName);
          this.componentCategories.set(componentName, category);
          return true;
        }
      }
    }
    return false;
  }
}

// Singleton instance
const enhancedRenderTracker = new EnhancedRenderTracker();

// Hook mejorado con más opciones
export const useEnhancedRenderTracker = (componentName, dependencies = [], options = {}) => {
  const { category, metadata = {}, trackDependencies = true } = options;

  // Registrar componente en categoría si se especifica
  React.useEffect(() => {
    if (category) {
      enhancedRenderTracker.registerComponent(componentName, category);
    }
  }, [componentName, category]);

  const renderCountRef = React.useRef(0);
  const previousDepsRef = React.useRef(dependencies);

  // Track renders usando useLayoutEffect para evitar loops
  React.useLayoutEffect(() => {
    renderCountRef.current += 1;

    // Solo trackear el render, no en cada ejecución del effect
    let reason = 'render';

    if (renderCountRef.current === 1) {
      reason = 'initial';
    } else if (dependencies.length > 0 && trackDependencies) {
      // Comparar con dependencias anteriores
      const depsChanged = dependencies.some((dep, index) => {
        const previousDeps = previousDepsRef.current;
        if (!previousDeps || !Array.isArray(previousDeps) || index >= previousDeps.length) {
          return true;
        }
        // Safe access: using slice to avoid object injection warning
        const [previousDep] = previousDeps.slice(index, index + 1);
        return dep !== previousDep;
      });
      if (depsChanged) {
        reason = 'dependency-change';
      }
    }

    enhancedRenderTracker.track(componentName, reason, metadata);

    // Actualizar referencia de dependencias
    previousDepsRef.current = dependencies;
  });
};

// Exportar tanto el tracker mejorado como el hook original para compatibilidad
export const useRenderTracker = useEnhancedRenderTracker;

// Registrar globalmente para compatibilidad con el sistema básico
if (globalThis.window !== undefined) {
  globalThis.enhancedRenderTracker = enhancedRenderTracker;
}

export default enhancedRenderTracker;

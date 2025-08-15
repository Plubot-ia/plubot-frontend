/**
 * renderTracker.js - Sistema de tracking de renders para auditoría de performance
 * Utilizado para identificar componentes con renders innecesarios
 */
import React from 'react';

import { renderTrack, info, isEnabled, performance } from './developmentLogger';

class RenderTracker {
  constructor() {
    this.renders = new Map();
    this.startTime = Date.now();
    this.logLimit = new Map(); // Límite de logs por componente para evitar spam
    this.reportInterval = undefined;
    this.silencedComponents = new Set(); // Componentes silenciados para reducir ruido
  }

  track(componentName, reason = 'unknown') {
    const now = Date.now();

    if (!this.renders.has(componentName)) {
      this.renders.set(componentName, {
        count: 0,
        firstRender: now,
        lastRender: now,
        reasons: new Map(),
        renderTimes: [],
      });
    }

    const componentData = this.renders.get(componentName);
    componentData.count++;
    componentData.lastRender = now;
    componentData.renderTimes.push(now);

    // Track reasons
    if (!componentData.reasons.has(reason)) {
      componentData.reasons.set(reason, 0);
    }
    componentData.reasons.set(reason, componentData.reasons.get(reason) + 1);

    // Log con límite para evitar spam (solo si no está silenciado)
    if (!this.silencedComponents.has(componentName)) {
      const logKey = `${componentName}-${reason}`;
      const currentLogs = this.logLimit.get(logKey) ?? 0;

      if (currentLogs < 5) {
        // Máximo 5 logs por componente-reason
        renderTrack(componentName, reason, { count: currentLogs + 1 });
        this.logLimit.set(logKey, currentLogs + 1);
      } else if (currentLogs === 5) {
        info(`${componentName} render logging silenced (too many renders)`);
        this.logLimit.set(logKey, currentLogs + 1);
      }
    }
  }

  getStats(componentName) {
    const data = this.renders.get(componentName);
    if (!data) return;

    const totalTime = Date.now() - this.startTime;
    const rendersPerSecond = (data.count / (totalTime / 1000)).toFixed(2);
    const avgTimeBetweenRenders =
      data.renderTimes.length > 1
        ? (data.renderTimes.at(-1) - data.renderTimes[0]) / (data.renderTimes.length - 1)
        : 0;

    return {
      component: componentName,
      totalRenders: data.count,
      rendersPerSecond: Number.parseFloat(rendersPerSecond),
      avgTimeBetweenRenders: Math.round(avgTimeBetweenRenders),
      reasons: Object.fromEntries(data.reasons),
      efficiency: this.calculateEfficiency(Number.parseFloat(rendersPerSecond)),
    };
  }

  calculateEfficiency(rendersPerSecond) {
    if (rendersPerSecond < 1) return 'EXCELLENT';
    if (rendersPerSecond < 2) return 'GOOD';
    if (rendersPerSecond < 5) return 'NEEDS_ATTENTION';
    return 'POOR';
  }

  getAllStats() {
    const stats = [];
    for (const componentName of this.renders.keys()) {
      stats.push(this.getStats(componentName));
    }

    return stats.sort((a, b) => b.rendersPerSecond - a.rendersPerSecond);
  }

  generateReport() {
    const stats = this.getAllStats();
    const totalTime = (Date.now() - this.startTime) / 1000;

    if (!isEnabled('performance')) {
      return stats; // No mostrar reporte en producción
    }

    performance('📊 RENDER PERFORMANCE REPORT');
    performance(`⏱️ Tracking time: ${totalTime.toFixed(1)}s`);
    performance(`📈 Total components tracked: ${stats.length}`);

    const problematicComponents = stats.filter(
      (s) => s.efficiency === 'POOR' || s.efficiency === 'NEEDS_ATTENTION',
    );
    if (problematicComponents.length > 0) {
      performance('🚨 COMPONENTS NEEDING OPTIMIZATION:');
      for (const stat of problematicComponents) {
        performance(
          `${stat.component}: ${stat.rendersPerSecond}/s (${stat.totalRenders} total) - ${stat.efficiency}`,
        );
        performance(
          `  Top reasons: ${Object.entries(stat.reasons)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([reason, count]) => `${reason}: ${count}`)
            .join(', ')}`,
        );
      }
    }

    const excellentComponents = stats.filter((s) => s.efficiency === 'EXCELLENT');
    if (excellentComponents.length > 0) {
      performance('✅ WELL-OPTIMIZED COMPONENTS:');
      for (const stat of excellentComponents) {
        performance(`${stat.component}: ${stat.rendersPerSecond}/s - ${stat.efficiency}`);
      }
    }

    return stats;
  }

  startAutoReporting(intervalMs = 10_000) {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }

    this.reportInterval = setInterval(() => {
      this.generateReport();
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
    this.startTime = Date.now();
  }

  // Métodos para gestionar componentes silenciados
  silenceComponent(componentName) {
    this.silencedComponents.add(componentName);
    info(`${componentName} render logging silenced (well-optimized)`);
  }

  unsilenceComponent(componentName) {
    this.silencedComponents.delete(componentName);
    info(`${componentName} render logging enabled`);
  }

  silenceWellOptimizedComponents() {
    const wellOptimizedComponents = [
      'DecisionNode',
      'StartNode',
      'MessageNode',
      'BackgroundScene',
      'EndNode',
      'OptionNode', // Ya optimizado según el checkpoint
      // EliteEdge REMOVIDO: Necesitamos ver sus renders para diagnosticar el problema
    ];

    for (const component of wellOptimizedComponents) {
      this.silenceComponent(component);
    }

    // eslint-disable-next-line no-console
    console.log(
      `🔇 Silenced ${wellOptimizedComponents.length} well-optimized components to reduce console noise`,
    );
  }

  getSilencedComponents() {
    return [...this.silencedComponents];
  }
}

// Singleton instance
const renderTracker = new RenderTracker();

// Helper hook para usar en componentes React
export const useRenderTracker = (componentName, dependencies = []) => {
  const renderCountRef = React.useRef(0);
  const previousDepsRef = React.useRef(dependencies);

  // Track renders usando useLayoutEffect para evitar loops
  React.useLayoutEffect(() => {
    renderCountRef.current += 1;

    // Solo trackear el render, no en cada ejecución del effect
    let reason = 'render';

    if (renderCountRef.current === 1) {
      reason = 'initial';
    } else if (dependencies.length > 0) {
      // Comparar con dependencias anteriores de forma segura usando serialización
      const previousDeps = previousDepsRef.current;
      const depsChanged = JSON.stringify(dependencies) !== JSON.stringify(previousDeps);
      if (depsChanged) {
        reason = 'dependency-change';
      }
    }

    // Track en ambos sistemas para compatibilidad
    renderTracker.track(componentName, reason);

    // También track en el sistema avanzado si está disponible
    if (globalThis.window !== undefined && globalThis.enhancedRenderTracker) {
      globalThis.enhancedRenderTracker.track(componentName, reason);
    }

    // Actualizar referencia de dependencias
    previousDepsRef.current = dependencies;
  });
};

export default renderTracker;

/**
 * performanceAudit.js - Script de auditoría automatizada de rendimiento
 * Ejecuta análisis completo de renders y genera reportes de optimización
 */

import renderAnalysis from './renderAnalysis';
import renderTracker from './renderTracker';

class PerformanceAudit {
  constructor() {
    this.isRunning = false;
    this.auditResults = undefined;
    this.startTime = undefined;
    this.auditDuration = 30_000; // 30 segundos por defecto
    this.reportInterval = 5000; // Reportes cada 5 segundos
    this.intervalId = undefined;
    this.timeoutId = undefined;
  }

  /**
   * Inicia una auditoría completa de rendimiento
   * @param {Object} options - Opciones de configuración
   * @param {number} options.duration - Duración de la auditoría en ms
   * @param {number} options.reportInterval - Intervalo de reportes en ms
   * @param {boolean} options.autoOptimize - Si generar recomendaciones automáticas
   */
  async startAudit(options = {}) {
    if (this.isRunning) {
      // eslint-disable-next-line no-console
      console.warn('🔄 Auditoría ya en progreso. Deteniendo auditoría anterior...');
      this.stopAudit();
    }

    const {
      duration = this.auditDuration,
      reportInterval = this.reportInterval,
      autoOptimize = true,
    } = options;

    // eslint-disable-next-line no-console
    console.log('🚀 INICIANDO AUDITORÍA DE RENDIMIENTO');
    // eslint-disable-next-line no-console
    console.log(`⏱️ Duración: ${duration / 1000}s | Reportes cada: ${reportInterval / 1000}s`);

    this.isRunning = true;
    this.startTime = Date.now();
    this.auditResults = {
      startTime: this.startTime,
      duration,
      snapshots: [],
      finalAnalysis: undefined,
      optimizationPlan: undefined,
    };

    // Resetear tracking y comenzar recolección
    renderTracker.reset();
    renderTracker.startAutoReporting(reportInterval);

    // Programar snapshots periódicos
    this.intervalId = setInterval(() => {
      this.captureSnapshot();
    }, reportInterval);

    // Programar finalización automática
    this.timeoutId = setTimeout(() => {
      this.completeAudit(autoOptimize);
    }, duration);

    return new Promise((resolve) => {
      this.resolveAudit = resolve;
    });
  }

  /**
   * Captura un snapshot del estado actual de renders
   */
  captureSnapshot() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.startTime;
    const stats = renderTracker.getAllStats();

    const snapshot = {
      timestamp: currentTime,
      elapsedTime,
      componentCount: stats.length,
      totalRenders: stats.reduce((sum, stat) => sum + stat.totalRenders, 0),
      averageRenderRate:
        stats.length > 0
          ? stats.reduce((sum, stat) => sum + stat.rendersPerSecond, 0) / stats.length
          : 0,
      criticalComponents: stats.filter((stat) => stat.rendersPerSecond > 2).length,
      stats: stats.map((stat) => ({
        component: stat.component,
        totalRenders: stat.totalRenders,
        rendersPerSecond: stat.rendersPerSecond,
        efficiency: this.calculateEfficiency(stat.rendersPerSecond),
        reasons: stat.reasons,
      })),
    };

    this.auditResults.snapshots.push(snapshot);

    // eslint-disable-next-line no-console
    console.log(`📊 Snapshot ${this.auditResults.snapshots.length} - ${elapsedTime / 1000}s`);
    // eslint-disable-next-line no-console
    console.log(
      `   Componentes: ${snapshot.componentCount} | Renders totales: ${snapshot.totalRenders}`,
    );
    // eslint-disable-next-line no-console
    console.log(
      `   Tasa promedio: ${snapshot.averageRenderRate.toFixed(2)}/s | Críticos: ${snapshot.criticalComponents}`,
    );
  }

  /**
   * Calcula la eficiencia basada en la tasa de renders
   */
  calculateEfficiency(renderRate) {
    if (renderRate < 0.5) return 'EXCELLENT';
    if (renderRate < 1) return 'GOOD';
    if (renderRate < 2) return 'NEEDS_ATTENTION';
    return 'POOR';
  }

  /**
   * Completa la auditoría y genera análisis final
   */
  async completeAudit(autoOptimize = true) {
    if (!this.isRunning) return;

    // eslint-disable-next-line no-console
    console.log('🏁 COMPLETANDO AUDITORÍA DE RENDIMIENTO');

    this.isRunning = false;
    renderTracker.stopAutoReporting();

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }

    // Capturar snapshot final
    this.captureSnapshot();

    // Generar análisis final
    const finalStats = renderTracker.getAllStats();
    this.auditResults.finalAnalysis = this.generateFinalAnalysis(finalStats);

    if (autoOptimize) {
      this.auditResults.optimizationPlan = this.generateOptimizationPlan(finalStats);
    }

    this.auditResults.endTime = Date.now();
    this.auditResults.actualDuration = this.auditResults.endTime - this.auditResults.startTime;

    // eslint-disable-next-line no-console
    console.log('✅ AUDITORÍA COMPLETADA');
    this.printFinalReport();

    if (this.resolveAudit) {
      this.resolveAudit(this.auditResults);
    }

    return this.auditResults;
  }

  /**
   * Detiene la auditoría manualmente
   */
  stopAudit() {
    if (!this.isRunning) return;

    // eslint-disable-next-line no-console
    console.log('⏹️ DETENIENDO AUDITORÍA MANUALMENTE');
    this.completeAudit(false);
  }

  /**
   * Genera análisis final de la auditoría
   */
  generateFinalAnalysis(stats) {
    const totalComponents = stats.length;
    const totalRenders = stats.reduce((sum, stat) => sum + stat.totalRenders, 0);
    const averageRenderRate =
      totalComponents > 0
        ? stats.reduce((sum, stat) => sum + stat.rendersPerSecond, 0) / totalComponents
        : 0;

    const efficiencyDistribution = {
      EXCELLENT: stats.filter((s) => this.calculateEfficiency(s.rendersPerSecond) === 'EXCELLENT')
        .length,
      GOOD: stats.filter((s) => this.calculateEfficiency(s.rendersPerSecond) === 'GOOD').length,
      NEEDS_ATTENTION: stats.filter(
        (s) => this.calculateEfficiency(s.rendersPerSecond) === 'NEEDS_ATTENTION',
      ).length,
      POOR: stats.filter((s) => this.calculateEfficiency(s.rendersPerSecond) === 'POOR').length,
    };

    const topRenderingComponents = stats
      .sort((a, b) => b.rendersPerSecond - a.rendersPerSecond)
      .slice(0, 10);

    const mostFrequentReasons = this.analyzeMostFrequentReasons(stats);

    return {
      totalComponents,
      totalRenders,
      averageRenderRate,
      efficiencyDistribution,
      topRenderingComponents,
      mostFrequentReasons,
      overallScore: this.calculateOverallScore(efficiencyDistribution, totalComponents),
    };
  }

  /**
   * Analiza las razones más frecuentes de renders
   */
  analyzeMostFrequentReasons(stats) {
    const reasonCounts = {};

    for (const stat of stats) {
      for (const [reason, count] of Object.entries(stat.reasons ?? {})) {
        // eslint-disable-next-line security/detect-object-injection
        reasonCounts[reason] = (reasonCounts[reason] ?? 0) + count;
      }
    }

    return Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([reason, count]) => ({ reason, count }));
  }

  /**
   * Calcula puntuación general de rendimiento
   */
  calculateOverallScore(distribution, total) {
    const weights = { EXCELLENT: 4, GOOD: 3, NEEDS_ATTENTION: 2, POOR: 1 };
    const weightedSum = Object.entries(distribution).reduce(
      // eslint-disable-next-line security/detect-object-injection
      (sum, [level, count]) => sum + weights[level] * count,
      0,
    );
    return Math.round((weightedSum / (total * 4)) * 100);
  }

  /**
   * Genera plan de optimización usando renderAnalysis
   */
  generateOptimizationPlan(stats) {
    const analyses = stats.map((stat) => renderAnalysis.analyzeComponent(stat.component, stat));

    return renderAnalysis.generateOptimizationPlan(analyses);
  }

  /**
   * Imprime reporte final en consola
   */
  printFinalReport() {
    const { finalAnalysis, optimizationPlan, actualDuration } = this.auditResults;

    // eslint-disable-next-line no-console
    console.log(`\n${'='.repeat(60)}`);
    // eslint-disable-next-line no-console
    console.log('📊 REPORTE FINAL DE AUDITORÍA DE RENDIMIENTO');
    // eslint-disable-next-line no-console
    console.log('='.repeat(60));

    // eslint-disable-next-line no-console
    console.log(`⏱️ Duración: ${(actualDuration / 1000).toFixed(1)}s`);
    // eslint-disable-next-line no-console
    console.log(`🎯 Puntuación General: ${finalAnalysis.overallScore}/100`);
    // eslint-disable-next-line no-console
    console.log(`📦 Componentes Analizados: ${finalAnalysis.totalComponents}`);
    // eslint-disable-next-line no-console
    console.log(`🔄 Renders Totales: ${finalAnalysis.totalRenders}`);
    // eslint-disable-next-line no-console
    console.log(`📈 Tasa Promedio: ${finalAnalysis.averageRenderRate.toFixed(2)} renders/s`);

    // eslint-disable-next-line no-console
    console.log('\n📊 DISTRIBUCIÓN DE EFICIENCIA:');
    for (const [level, count] of Object.entries(finalAnalysis.efficiencyDistribution)) {
      const percentage = ((count / finalAnalysis.totalComponents) * 100).toFixed(1);
      // eslint-disable-next-line no-console
      console.log(`   ${level}: ${count} componentes (${percentage}%)`);
    }

    // eslint-disable-next-line no-console
    console.log('\n🔥 TOP COMPONENTES CON MÁS RENDERS:');
    for (const [index, comp] of finalAnalysis.topRenderingComponents.slice(0, 5).entries()) {
      // eslint-disable-next-line no-console
      console.log(
        `   ${index + 1}. ${comp.component}: ${comp.rendersPerSecond.toFixed(2)}/s (${comp.totalRenders} total)`,
      );
    }

    // eslint-disable-next-line no-console
    console.log('\n🎯 RAZONES MÁS FRECUENTES:');
    for (const [index, reason] of finalAnalysis.mostFrequentReasons.slice(0, 5).entries()) {
      // eslint-disable-next-line no-console
      console.log(`   ${index + 1}. ${reason.reason}: ${reason.count} veces`);
    }

    if (optimizationPlan) {
      // eslint-disable-next-line no-console
      console.log('\n🚨 OPTIMIZACIONES CRÍTICAS:');
      for (const [index, comp] of optimizationPlan.criticalComponents.slice(0, 3).entries()) {
        // eslint-disable-next-line no-console
        console.log(`   ${index + 1}. ${comp.name}: ${comp.currentRenderRate.toFixed(1)}/s`);
        for (const rec of comp.recommendations.filter((r) => r.type === 'CRITICAL').slice(0, 1)) {
          // eslint-disable-next-line no-console
          console.log(`      → ${rec.solution}`);
        }
      }

      // eslint-disable-next-line no-console
      console.log(
        `\n💡 Potencial de Optimización: ${optimizationPlan.totalOptimizationPotential.toFixed(1)} renders/s`,
      );
    }

    // eslint-disable-next-line no-console
    console.log(`${'='.repeat(60)}\n`);
  }

  /**
   * Exporta resultados a JSON
   */
  exportResults() {
    if (!this.auditResults) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ No hay resultados de auditoría para exportar');
      return;
    }

    const exportData = {
      ...this.auditResults,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    // eslint-disable-next-line no-console
    console.log('📤 Resultados exportados:', exportData);
    return exportData;
  }

  /**
   * Obtiene resumen rápido del estado actual
   */
  getQuickSummary() {
    const stats = renderTracker.getAllStats();
    const criticalCount = stats.filter((s) => s.rendersPerSecond > 2).length;
    const totalRenders = stats.reduce((sum, stat) => sum + stat.totalRenders, 0);

    return {
      componentsTracked: stats.length,
      totalRenders,
      criticalComponents: criticalCount,
      averageRenderRate:
        stats.length > 0
          ? stats.reduce((sum, stat) => sum + stat.rendersPerSecond, 0) / stats.length
          : 0,
      isHealthy: criticalCount === 0,
    };
  }
}

// Instancia singleton
const performanceAudit = new PerformanceAudit();

// Métodos de conveniencia para uso global
globalThis.startPerformanceAudit = (options) => performanceAudit.startAudit(options);
globalThis.stopPerformanceAudit = () => performanceAudit.stopAudit();
globalThis.getPerformanceSummary = () => performanceAudit.getQuickSummary();
globalThis.exportPerformanceResults = () => performanceAudit.exportResults();

export default performanceAudit;

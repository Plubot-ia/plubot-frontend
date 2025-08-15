/**
 * performanceInit.js - Inicializador del sistema de auditoría de rendimiento
 * Configura y activa todas las herramientas de análisis de performance
 */

import autoInstrument from './autoInstrument';
import { performance } from './developmentLogger';
import performanceAudit from './performanceAudit';
import renderAnalysis from './renderAnalysis';
import renderTracker from './renderTracker';

class PerformanceInit {
  constructor() {
    this.isInitialized = false;
    this.config = {
      enableAutoInstrument: true,
      enableRealTimeMonitor: true,
      autoStartTracking: true,
      reportInterval: 5000,
      logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    };
  }

  /**
   * Inicializa el sistema completo de auditoría de rendimiento
   * @param {Object} customConfig - Configuración personalizada
   */
  async initialize(customConfig = {}) {
    if (this.isInitialized) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Sistema de auditoría ya inicializado');
      return;
    }

    // Combinar configuración
    this.config = { ...this.config, ...customConfig };

    performance('🚀 INICIALIZANDO SISTEMA DE AUDITORÍA DE RENDIMIENTO');
    performance('='.repeat(60));

    try {
      // 1. Configurar render tracker
      await this.setupRenderTracker();

      // 2. Configurar auto-instrumentación
      if (this.config.enableAutoInstrument) {
        await this.setupAutoInstrumentation();
      }

      // 3. Configurar análisis automático
      await this.setupAnalysis();

      // 4. Configurar herramientas globales
      await this.setupGlobalTools();

      // 5. Iniciar tracking automático si está habilitado
      if (this.config.autoStartTracking) {
        await this.startTracking();
      }

      this.isInitialized = true;
      // eslint-disable-next-line no-console
      console.log('✅ SISTEMA DE AUDITORÍA INICIALIZADO CORRECTAMENTE');
      // eslint-disable-next-line no-console
      console.log('='.repeat(60));

      // Mostrar comandos disponibles
      this.showAvailableCommands();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error inicializando sistema de auditoría:', error);
      throw error;
    }
  }

  /**
   * Configura el render tracker
   */
  async setupRenderTracker() {
    // eslint-disable-next-line no-console
    console.log('📊 Configurando Render Tracker...');

    // Configurar límites y opciones
    renderTracker.setOptions({
      maxLogEntries: 1000,
      reportInterval: this.config.reportInterval,
      enableDetailedLogging: this.config.logLevel === 'debug',
    });

    // Silenciar componentes bien optimizados para reducir ruido en consola
    renderTracker.silenceWellOptimizedComponents();

    // eslint-disable-next-line no-console
    console.log('   ✓ Render Tracker configurado');
  }

  /**
   * Configura la auto-instrumentación
   */
  async setupAutoInstrumentation() {
    // eslint-disable-next-line no-console
    console.log('🔧 Configurando Auto-Instrumentación...');

    autoInstrument.enable();
    autoInstrument.setupCommonPatterns();

    // eslint-disable-next-line no-console
    console.log('   ✓ Auto-Instrumentación habilitada');
  }

  /**
   * Configura el sistema de análisis
   */
  async setupAnalysis() {
    // eslint-disable-next-line no-console
    console.log('🧠 Configurando Sistema de Análisis...');

    // Configurar thresholds personalizados si es necesario
    renderAnalysis.setThresholds({
      excellent: 0.5,
      good: 1,
      needsAttention: 2,
      poor: 3,
    });

    // eslint-disable-next-line no-console
    console.log('   ✓ Sistema de Análisis configurado');
  }

  /**
   * Configura herramientas globales en window
   */
  async setupGlobalTools() {
    // eslint-disable-next-line no-console
    console.log('🌐 Configurando Herramientas Globales...');

    // Comandos principales
    globalThis.perf = {
      // Auditoría
      startAudit: (options) => performanceAudit.startAudit(options),
      stopAudit: () => performanceAudit.stopAudit(),
      getResults: () => performanceAudit.exportResults(),

      // Tracking
      startTracking: () => renderTracker.startAutoReporting(this.config.reportInterval),
      stopTracking: () => renderTracker.stopAutoReporting(),
      getStats: () => renderTracker.getAllStats(),
      reset: () => renderTracker.reset(),

      // Análisis
      analyze: (componentName) => {
        const stats = renderTracker.getAllStats();
        const componentStats = stats.find((s) => s.component === componentName);
        return componentStats
          ? renderAnalysis.analyzeComponent(componentName, componentStats)
          : undefined;
      },
      generatePlan: () => {
        const stats = renderTracker.getAllStats();
        const analyses = stats.map((stat) => renderAnalysis.analyzeComponent(stat.component, stat));
        return renderAnalysis.generateOptimizationPlan(analyses);
      },

      // Auto-instrumentación
      instrument: (components) => autoInstrument.instrumentComponents(components),
      detectHigh: () => autoInstrument.detectHighRenderComponents(),
      report: () => autoInstrument.generateInstrumentationReport(),

      // Utilidades
      summary: () => performanceAudit.getQuickSummary(),
      help: () => this.showHelp(),
    };

    // Comandos de conveniencia adicionales
    globalThis.startPerf = globalThis.perf.startAudit;
    globalThis.stopPerf = globalThis.perf.stopAudit;
    globalThis.perfStats = globalThis.perf.getStats;
    globalThis.perfSummary = globalThis.perf.summary;

    // eslint-disable-next-line no-console
    console.log('   ✓ Herramientas globales configuradas');
  }

  /**
   * Inicia el tracking automático
   */
  async startTracking() {
    // eslint-disable-next-line no-console
    console.log('▶️ Iniciando Tracking Automático...');

    renderTracker.startAutoReporting(this.config.reportInterval);

    // eslint-disable-next-line no-console
    console.log(`   ✓ Tracking iniciado (reportes cada ${this.config.reportInterval / 1000}s)`);
  }

  /**
   * Muestra comandos disponibles
   */
  showAvailableCommands() {
    // eslint-disable-next-line no-console
    console.log('\n🔠️ COMANDOS DISPONIBLES:');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('📊 AUDITORÍA COMPLETA:');
    // eslint-disable-next-line no-console
    console.log('   perf.startAudit()           - Iniciar auditoría de 30s');
    // eslint-disable-next-line no-console
    console.log('   perf.startAudit({duration: 60000}) - Auditoría personalizada');
    // eslint-disable-next-line no-console
    console.log('   perf.stopAudit()            - Detener auditoría');
    // eslint-disable-next-line no-console
    console.log('   perf.getResults()           - Exportar resultados');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('📈 TRACKING EN TIEMPO REAL:');
    // eslint-disable-next-line no-console
    console.log('   perf.getStats()             - Ver estadísticas actuales');
    // eslint-disable-next-line no-console
    console.log('   perf.summary()              - Resumen rápido');

    // eslint-disable-next-line no-console
    console.log('   perf.reset()                - Resetear contadores');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('🧠 ANÁLISIS Y OPTIMIZACIÓN:');
    // eslint-disable-next-line no-console
    console.log('   perf.analyze("ComponentName") - Analizar componente específico');
    // eslint-disable-next-line no-console
    console.log('   perf.generatePlan()         - Generar plan de optimización');
    // eslint-disable-next-line no-console
    console.log('   perf.detectHigh()           - Detectar componentes problemáticos');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('🔧 AUTO-INSTRUMENTACIÓN:');
    // eslint-disable-next-line no-console
    console.log('   perf.instrument({...})      - Instrumentar componentes');
    // eslint-disable-next-line no-console
    console.log('   perf.report()               - Reporte de instrumentación');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('⚡ COMANDOS RÁPIDOS:');
    // eslint-disable-next-line no-console
    console.log('   startPerf()                 - Alias para perf.startAudit()');
    // eslint-disable-next-line no-console
    console.log('   stopPerf()                  - Alias para perf.stopAudit()');
    // eslint-disable-next-line no-console
    console.log('   perfStats()                 - Alias para perf.getStats()');
    // eslint-disable-next-line no-console
    console.log('   perfSummary()               - Alias para perf.summary()');
    // eslint-disable-next-line no-console
    console.log('');
  }

  /**
   * Muestra ayuda detallada
   */
  showHelp() {
    // eslint-disable-next-line no-console
    console.log(`\n${'='.repeat(60)}`);
    // eslint-disable-next-line no-console
    console.log('📚 GUÍA DE USO DEL SISTEMA DE AUDITORÍA DE RENDIMIENTO');
    // eslint-disable-next-line no-console
    console.log('='.repeat(60));
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('🎯 FLUJO RECOMENDADO:');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('1. Ejecutar auditoría completa:');
    // eslint-disable-next-line no-console
    console.log('   startPerf({duration: 30000})  // 30 segundos');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('2. Revisar resultados:');
    // eslint-disable-next-line no-console
    console.log('   perf.getResults()             // Ver reporte completo');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('3. Analizar componentes críticos:');
    // eslint-disable-next-line no-console
    console.log('   perf.detectHigh()             // Detectar problemáticos');
    // eslint-disable-next-line no-console
    console.log('   perf.analyze("ComponentName") // Análisis detallado');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('4. Generar plan de optimización:');
    // eslint-disable-next-line no-console
    console.log('   perf.generatePlan()           // Plan automático');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('🔍 MONITOREO CONTINUO:');
    // eslint-disable-next-line no-console
    console.log('   perfSummary()                 // Estado actual');
    // eslint-disable-next-line no-console
    console.log('   perfStats()                   // Estadísticas detalladas');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('⚙️ CONFIGURACIÓN:');
    // eslint-disable-next-line no-console
    console.log('   El monitor visual está disponible en la esquina superior derecha');
    // eslint-disable-next-line no-console
    console.log('   Los componentes ya están instrumentados automáticamente');
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('='.repeat(60));
  }

  /**
   * Ejecuta una auditoría de demostración
   */
  async runDemo() {
    // eslint-disable-next-line no-console
    console.log('🎬 EJECUTANDO DEMO DE AUDITORÍA...');

    // Auditoría corta de 10 segundos
    const results = await performanceAudit.startAudit({
      duration: 10_000,
      reportInterval: 2000,
      autoOptimize: true,
    });

    // eslint-disable-next-line no-console
    console.log('🎬 DEMO COMPLETADA');
    return results;
  }

  /**
   * Verifica el estado del sistema
   */
  healthCheck() {
    const health = {
      initialized: this.isInitialized,
      renderTracker: renderTracker.isActive(),
      autoInstrument: autoInstrument.isEnabled,
      componentsTracked: renderTracker.getAllStats().length,
      timestamp: new Date().toISOString(),
    };

    // eslint-disable-next-line no-console
    console.log('🏥 HEALTH CHECK:', health);
    return health;
  }

  /**
   * Limpia y resetea completo el sistema
   */
  cleanup() {
    // eslint-disable-next-line no-console
    console.log('🧹 LIMPIANDO SISTEMA DE AUDITORÍA...');

    renderTracker.stopAutoReporting();
    renderTracker.reset();
    autoInstrument.disable();
    autoInstrument.clearInstrumentation();

    this.isInitialized = false;

    // eslint-disable-next-line no-console
    console.log('✅ Sistema limpiado');
  }
}

// Instancia singleton
const performanceInit = new PerformanceInit();

// Auto-inicialización en desarrollo
/* global process */
if (process.env.NODE_ENV === 'development') {
  // Inicializar automáticamente después de un pequeño delay
  setTimeout(() => {
    performanceInit.initialize({
      logLevel: 'info',
      autoStartTracking: true,
      reportInterval: 5000,
    });
  }, 1000);
}

// Exportar para uso manual
export default performanceInit;

/* global process */
/**
 * logControl.js - Control global de logging para desarrollo/producción
 * Permite silenciar selectivamente diferentes tipos de logs
 */

class LogControl {
  constructor() {
    // Access environment variables safely
    const nodeEnvironment =
      typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : 'development';
    this.isDevelopment = nodeEnvironment === 'development';
    this.isProduction = nodeEnvironment === 'production';

    // Configuración granular de logging
    this.config = {
      // Control global por entorno
      globalEnabled: this.isDevelopment,

      // Control por categorías específicas
      categories: {
        renderTracking: false, // ❌ Silenciar tracking de renders
        memoComparisons: false, // ❌ Silenciar comparaciones de memo
        performanceReports: false, // ❌ Silenciar reportes de performance
        componentLifecycle: false, // ❌ Silenciar logs de ciclo de vida
        optimization: false, // ❌ Silenciar logs de optimización
        debugging: false, // ❌ Silenciar logs de debugging
        info: false, // ❌ Silenciar logs informativos
        i18n: false, // ❌ Silenciar logs de internacionalización
        warnings: true, // ✅ Mantener warnings importantes
        errors: true, // ✅ Mantener errores siempre
      },

      // Control por componentes específicos
      components: {
        EliteEdge: false, // ❌ Silenciar EliteEdge (cuello de botella)
        OptionNode: false, // ❌ Silenciar OptionNode
        EndNode: false, // ❌ Silenciar EndNode
        EpicHeader: false, // ❌ Silenciar EpicHeader
        FlowMain: false, // ❌ Silenciar FlowMain
        CustomMiniMap: false, // ❌ Silenciar CustomMiniMap
        NodePalette: false, // ❌ Silenciar NodePalette
        ByteAssistant: false, // ❌ Silenciar ByteAssistant
        BackgroundScene: false, // ❌ Silenciar BackgroundScene
        MessageNode: false, // ❌ Silenciar MessageNode
        DecisionNode: false, // ❌ Silenciar DecisionNode
        StartNode: false, // ❌ Silenciar StartNode
      },
    };
  }

  // Verificar si un log debe mostrarse
  shouldLog(category, componentName) {
    // En producción, solo errores críticos
    if (this.isProduction) {
      return category === 'errors';
    }

    // Control global deshabilitado
    if (!this.config.globalEnabled) {
      return category === 'errors' || category === 'warnings';
    }

    // Control por componente específico
    if (
      componentName &&
      Object.prototype.hasOwnProperty.call(this.config.components, componentName)
    ) {
      // eslint-disable-next-line security/detect-object-injection
      return this.config.components[componentName];
    }

    // Control por categoría
    // eslint-disable-next-line security/detect-object-injection
    return this.config.categories[category] ?? false;
  }

  // Método de logging condicional
  conditionalLog(category, message, componentName, data = {}) {
    if (!this.shouldLog(category, componentName)) {
      return; // Silenciar log
    }

    // Mostrar log según la categoría
    switch (category) {
      case 'errors': {
        // eslint-disable-next-line no-console
        console.error('❌ ERROR:', message, data);
        break;
      }
      case 'warnings': {
        // eslint-disable-next-line no-console
        console.warn('⚠️ WARNING:', message, data);
        break;
      }
      case 'info': {
        // DISABLED: Info logging to prevent console spam
        // console.log('ℹ️ INFO:', message, data);
        break;
      }
      case 'debugging': {
        // DISABLED: Debug logging to prevent console spam
        // console.log('🔍 DEBUG:', message, data);
        break;
      }
      case 'renderTracking': {
        // DISABLED: Render tracking to prevent console spam
        // console.log('🔄 RENDER:', message, data);
        break;
      }
      case 'memoComparisons': {
        // DISABLED: Memo comparisons to prevent console spam
        // console.log('🔍 MEMO:', message, data);
        break;
      }
      case 'performanceReports': {
        // DISABLED: Performance reports to prevent console spam
        // console.log('📊 PERFORMANCE:', message, data);
        break;
      }
      case 'optimization': {
        // DISABLED: Optimization logging to prevent console spam
        // console.log('⚡ OPTIMIZATION:', message, data);
        break;
      }
      case 'i18n': {
        // DISABLED: i18n logging to prevent console spam
        // console.log('🌐 I18N:', message, data);
        break;
      }
      default: {
        // DISABLED: Default logging to prevent console spam
        // console.log(message, data);
        break;
      }
    }
  }

  // Métodos de conveniencia
  error(message, data = {}, componentName) {
    this.conditionalLog('errors', message, componentName, data);
  }

  warn(message, data = {}, componentName) {
    this.conditionalLog('warnings', message, componentName, data);
  }

  info(message, data = {}, componentName) {
    this.conditionalLog('info', message, componentName, data);
  }

  debug(message, data = {}, componentName) {
    this.conditionalLog('debugging', message, componentName, data);
  }

  renderTrack(message, data = {}, componentName) {
    this.conditionalLog('renderTracking', message, componentName, data);
  }

  memoComparison(message, data = {}, componentName) {
    this.conditionalLog('memoComparisons', message, componentName, data);
  }

  performance(message, data = {}, componentName) {
    this.conditionalLog('performanceReports', message, componentName, data);
  }

  optimization(message, data = {}, componentName) {
    this.conditionalLog('optimization', message, componentName, data);
  }

  i18n(componentName, message, data = {}) {
    this.conditionalLog('i18n', message, componentName, data);
  }

  // Habilitar logs temporalmente para debugging específico
  enableComponent(componentName) {
    if (Object.prototype.hasOwnProperty.call(this.config.components, componentName)) {
      // eslint-disable-next-line security/detect-object-injection
      this.config.components[componentName] = true;
      // DISABLED: Component enable logging to prevent console spam
      // console.log(`🔊 Logging enabled for ${componentName}`);
    }
  }

  // Deshabilitar logs de componente
  disableComponent(componentName) {
    if (Object.prototype.hasOwnProperty.call(this.config.components, componentName)) {
      // eslint-disable-next-line security/detect-object-injection
      this.config.components[componentName] = false;
      // DISABLED: Component disable logging to prevent console spam
      // console.log(`🔇 Logging disabled for ${componentName}`);
    }
  }

  // Habilitar categoría específica
  enableCategory(category) {
    if (Object.prototype.hasOwnProperty.call(this.config.categories, category)) {
      // eslint-disable-next-line security/detect-object-injection
      this.config.categories[category] = true;
      // DISABLED: Category enable logging to prevent console spam
      // console.log(`🔊 Category ${category} enabled`);
    }
  }

  // Deshabilitar categoría específica
  disableCategory(category) {
    if (Object.prototype.hasOwnProperty.call(this.config.categories, category)) {
      // eslint-disable-next-line security/detect-object-injection
      this.config.categories[category] = false;
      // DISABLED: Category disable logging to prevent console spam
      // console.log(`🔇 Category ${category} disabled`);
    }
  }

  // Mostrar configuración actual
  showConfig() {
    // DISABLED: Config display logging to prevent console spam
    // console.log('📋 LOG CONTROL CONFIG:', {
    //   environment: this.isDevelopment ? 'development' : 'production',
    //   globalEnabled: this.config.globalEnabled,
    //   categories: this.config.categories,
    //   components: this.config.components,
    // });
  }

  // Silenciar todos los logs excepto errores críticos
  silenceAll() {
    for (const category of Object.keys(this.config.categories)) {
      if (category !== 'errors') {
        // eslint-disable-next-line security/detect-object-injection
        this.config.categories[category] = false;
      }
    }

    for (const component of Object.keys(this.config.components)) {
      // eslint-disable-next-line security/detect-object-injection
      this.config.components[component] = false;
    }

    // DISABLED: Silence all logging to prevent console spam
    // console.log('🔇 All logging silenced except errors');
  }

  // Restaurar configuración por defecto
  reset() {
    this.config.categories = {
      renderTracking: false,
      memoComparisons: false,
      performanceReports: false,
      componentLifecycle: false,
      optimization: false,
      debugging: false,
      info: false,
      warnings: true,
      errors: true,
    };

    for (const component of Object.keys(this.config.components)) {
      // eslint-disable-next-line security/detect-object-injection
      this.config.components[component] = false;
    }

    // DISABLED: Reset logging to prevent console spam
    // console.log('🔄 Log control reset to default (silent mode)');
  }
}

// Instancia singleton
const logControl = new LogControl();

// Silenciar todos los logs por defecto para evitar flood
logControl.silenceAll();

// TEMPORAL: Habilitar debugging para OptionNode
logControl.enableComponent('OptionNode');
logControl.enableComponent('DecisionNode');

// Exportar instancia y métodos de conveniencia
export const shouldLog = logControl.shouldLog.bind(logControl);
export const conditionalLog = logControl.conditionalLog.bind(logControl);
export const error = logControl.error.bind(logControl);
export const warn = logControl.warn.bind(logControl);
export const info = logControl.info.bind(logControl);
export const debug = logControl.debug.bind(logControl);
export const renderTrack = logControl.renderTrack.bind(logControl);
export const memoComparison = logControl.memoComparison.bind(logControl);
export const performance = logControl.performance.bind(logControl);
export const optimization = logControl.optimization.bind(logControl);
export const enableComponent = logControl.enableComponent.bind(logControl);
export const disableComponent = logControl.disableComponent.bind(logControl);
export const enableCategory = logControl.enableCategory.bind(logControl);
export const disableCategory = logControl.disableCategory.bind(logControl);
export const showConfig = logControl.showConfig.bind(logControl);
export const silenceAll = logControl.silenceAll.bind(logControl);
export const reset = logControl.reset.bind(logControl);

export default logControl;

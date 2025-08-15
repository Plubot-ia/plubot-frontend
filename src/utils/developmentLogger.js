/**
 * developmentLogger.js - Sistema de logging inteligente para desarrollo/producción
 * Ahora integrado con logControl para eliminar flood de logs
 */
import logControl from './logControl';

class DevelopmentLogger {
  constructor() {
    this.logControl = logControl;
  }

  // Logging de render tracking (controlado por logControl)
  renderTrack(componentName, reason, details = {}) {
    this.logControl.renderTrack(`${componentName}: ${reason}`, details, componentName);
  }

  // Logging de performance (controlado por logControl)
  performance(message, data = {}) {
    this.logControl.performance(message, data);
  }

  // Logging de optimización (controlado por logControl)
  optimization(message, data = {}) {
    this.logControl.optimization(message, data);
  }

  // Logging de debugging (controlado por logControl)
  debug(message, data = {}) {
    this.logControl.debug(message, data);
  }

  // Logging de información (controlado por logControl)
  info(message, data = {}) {
    this.logControl.info(message, data);
  }

  // Logging de warnings (controlado por logControl)
  warn(message, data = {}) {
    this.logControl.warn(message, data);
  }

  // Logging de errores (siempre activo)
  error(message, error = {}) {
    this.logControl.error(message, error);
  }

  // Método para logging condicional personalizado
  conditionalLog(category, message, data = {}) {
    this.logControl.conditionalLog(category, message, undefined, data);
  }

  // Método para verificar si una categoría está activa
  isEnabled(category) {
    return this.logControl.shouldLog(category);
  }

  // Método para obtener configuración actual
  getConfig() {
    return this.logControl.showConfig();
  }
}

// Instancia singleton
const developmentLogger = new DevelopmentLogger();

// Métodos de conveniencia para importación directa
export const renderTrack = developmentLogger.renderTrack.bind(developmentLogger);
export const performance = developmentLogger.performance.bind(developmentLogger);
export const optimization = developmentLogger.optimization.bind(developmentLogger);
export const debug = developmentLogger.debug.bind(developmentLogger);
export const info = developmentLogger.info.bind(developmentLogger);
export const warn = developmentLogger.warn.bind(developmentLogger);
export const error = developmentLogger.error.bind(developmentLogger);
export const conditionalLog = developmentLogger.conditionalLog.bind(developmentLogger);
export const isEnabled = developmentLogger.isEnabled.bind(developmentLogger);
export const getConfig = developmentLogger.getConfig.bind(developmentLogger);

export default developmentLogger;

/**
 * @file loggerService.js
 * @description Servicio de logging centralizado y consciente del entorno.
 * @author PLUBOT Team & Cascade AI
 */

// Determinar si estamos en un entorno de producción
const isProduction = import.meta.env.MODE === 'production';

/**
 * Un objeto logger que proporciona métodos de logging seguros.
 * En producción, todos los logs están deshabilitados por defecto para evitar
 * exponer información sensible en la consola del cliente.
 * En desarrollo, se utilizan los métodos de la consola nativa.
 */
const logger = {
  /**
   * Registra un mensaje de información general.
   * @param {...any} arguments_ - Argumentos a registrar.
   */
  log: (...arguments_) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.log(...arguments_);
    }
  },

  /**
   * Registra un mensaje de advertencia.
   * @param {...any} arguments_ - Argumentos a registrar.
   */
  warn: (...arguments_) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.warn(...arguments_);
    }
  },

  /**
   * Registra un mensaje de error.
   * @param {...any} arguments_ - Argumentos a registrar.
   */
  error: (...arguments_) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.error(...arguments_);
    }
    // Futura integración: Enviar errores a un servicio de monitoreo (ej. Sentry)
    // if (isProduction) { Sentry.captureException(new Error(args[0])); }
  },

  /**
   * Registra un mensaje de información detallada (verbose).
   * @param {...any} arguments_ - Argumentos a registrar.
   */
  info: (...arguments_) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.info(...arguments_);
    }
  },
};

export default logger;

import logger from '../services/loggerService';

/**
 * Sistema centralizado de manejo de errores para el editor de flujos.
 * Proporciona funciones para capturar, clasificar, registrar y manejar errores
 * de manera coherente en toda la aplicación.
 */

// Constantes para tipos de errores
export const ERROR_TYPES = {
  AUTH: 'auth', // Errores de autenticación
  NETWORK: 'network', // Errores de red
  VALIDATION: 'validation', // Errores de validación de datos
  API: 'api', // Errores de API
  FLOW: 'flow', // Errores específicos del editor de flujos
  RENDERING: 'rendering', // Errores de renderizado
  STORAGE: 'storage', // Errores de almacenamiento
  GENERAL: 'general', // Errores generales
};

/**
 * Clasifica un error HTTP basado en el código de estado
 * @param {Error} error - Error con respuesta HTTP
 * @param {Object} errorInfo - Información base del error a actualizar
 */
function classifyHttpError(error, errorInfo) {
  const { status } = error.response;
  errorInfo.data.status = status;
  errorInfo.data.responseData = error.response.data;

  // Clasificar por código de estado
  switch (status) {
    case 401:
    case 403: {
      errorInfo.type = ERROR_TYPES.AUTH;
      errorInfo.message = 'Sesión expirada o no autorizado';
      break;
    }
    case 404: {
      errorInfo.type = ERROR_TYPES.API;
      errorInfo.message = 'Recurso no encontrado';
      break;
    }
    case 422: {
      errorInfo.type = ERROR_TYPES.VALIDATION;
      errorInfo.message = 'Datos no válidos';
      break;
    }
    default: {
      if (status >= 500) {
        errorInfo.type = ERROR_TYPES.API;
        errorInfo.message = 'Error en el servidor';
      }
    }
  }
}

/**
 * Clasifica un error de red
 * @param {Object} errorInfo - Información base del error a actualizar
 */
function classifyNetworkError(errorInfo) {
  errorInfo.type = ERROR_TYPES.NETWORK;
  errorInfo.message = 'Error de conexión. Verifica tu red.';
}

/**
 * Clasifica un error basado en el mensaje
 * @param {Error} error - Error con mensaje
 * @param {Object} errorInfo - Información base del error a actualizar
 */
function classifyMessageBasedError(error, errorInfo) {
  if (error.message && error.message.includes('validateFlow')) {
    errorInfo.type = ERROR_TYPES.VALIDATION;
  } else if (error.message && error.message.includes('storage')) {
    errorInfo.type = ERROR_TYPES.STORAGE;
  }
}

/**
 * Captura y clasifica un error
 * @param {Error} error - El objeto de error
 * @param {string} context - Contexto donde ocurrió el error
 * @returns {Object} Información clasificada sobre el error
 */
export function captureError(error, context = 'unknown') {
  // Registrar en consola para debugging

  // Información básica del error
  const errorInfo = {
    originalError: error,
    message: error.message || 'Error desconocido',
    context,
    timestamp: Date.now(),
    type: ERROR_TYPES.GENERAL, // Tipo por defecto
    data: {},
  };

  // Clasificar error según sus características
  if (error.response) {
    classifyHttpError(error, errorInfo);
  } else if (error.request) {
    classifyNetworkError(errorInfo);
  } else {
    classifyMessageBasedError(error, errorInfo);
  }

  // Guardar en histórico de errores
  saveErrorToLog(errorInfo);

  return errorInfo;
}

/**
 * Maneja un error según su tipo y contexto
 * @param {Object} errorInfo - Información del error (de captureError)
 * @param {Function} notifyUser - Función para notificar al usuario
 * @returns {Object} Acciones recomendadas
 */
export function handleError(errorInfo, notifyUser) {
  // Por defecto: mostrar notificación si está disponible
  if (typeof notifyUser === 'function') {
    notifyUser(errorInfo.message, 'error');
  }

  // Determinar acciones según el tipo de error
  const actions = {
    shouldRedirect: false,
    shouldRetry: false,
    shouldRecover: false,
    shouldClearCache: false,
    path: undefined,
  };

  switch (errorInfo.type) {
    case ERROR_TYPES.AUTH: {
      // Limpiar token y redirigir a login
      localStorage.removeItem('access_token');
      actions.shouldRedirect = true;
      actions.path = '/login';
      break;
    }

    case ERROR_TYPES.NETWORK: {
      // Sugerir reintentar
      actions.shouldRetry = true;
      break;
    }

    case ERROR_TYPES.VALIDATION: {
      // Mostrar detalles de validación si están disponibles
      if (errorInfo.data.responseData?.errors) {
        const detailedMessage = Object.entries(errorInfo.data.responseData.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join('\n');

        if (notifyUser) {
          notifyUser(`Datos no válidos:\n${detailedMessage}`, 'error');
        }
      }
      break;
    }

    case ERROR_TYPES.FLOW: {
      // Intentar recuperación automática
      actions.shouldRecover = true;
      break;
    }

    case ERROR_TYPES.STORAGE: {
      // Limpiar caché y reintentar
      actions.shouldClearCache = true;
      actions.shouldRetry = true;
      break;
    }
    default: {
      break;
    }
  }

  return actions;
}

/**
 * Guarda un error en el registro local para análisis posterior
 * @param {Object} errorInfo - Información del error
 */
function saveErrorToLog(errorInfo) {
  try {
    // Obtener log existente
    const errorLog = JSON.parse(localStorage.getItem('flow_error_log') || '[]');

    // Añadir nuevo error (sin el objeto de error original para evitar ciclos)
    const logEntry = {
      ...errorInfo,
      originalError: undefined,
      stackTrace: errorInfo.originalError?.stack,
    };

    // Limitar a los últimos 20 errores
    errorLog.push(logEntry);
    if (errorLog.length > 20) {
      errorLog.shift();
    }

    // Guardar log actualizado
    localStorage.setItem('flow_error_log', JSON.stringify(errorLog));
  } catch (error) {
    logger.error('Failed to save error to log:', error);
  }
}

/**
 * Recupera datos de un respaldo local si está disponible.
 * @param {string} backupId - ID del respaldo a recuperar.
 * @returns {object | undefined} Datos recuperados o undefined si no hay respaldo o si ocurre un error.
 */
export function recoverFromBackup(backupId) {
  let recoveredData;
  try {
    const backup = localStorage.getItem(backupId);
    if (backup) {
      recoveredData = JSON.parse(backup);
    } else {
      logger.warn(`No se encontró respaldo con ID ${backupId}`);
    }
  } catch (error) {
    logger.error(`Error al recuperar respaldo ${backupId}:`, error);
  }
  return recoveredData;
}

/**
 * Genera un reporte de errores para enviar al equipo de soporte
 * @returns {Object} Reporte de errores
 */
export function generateErrorReport() {
  try {
    const errorLog = JSON.parse(localStorage.getItem('flow_error_log') || '[]');
    const backups = [];

    // Buscar respaldos existentes
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('flow_backup_')) {
        try {
          const backup = JSON.parse(localStorage.getItem(key));
          backups.push({
            id: key,
            timestamp: backup.timestamp,
            nodesCount: backup.nodes?.length ?? 0,
            edgesCount: backup.edges?.length ?? 0,
          });
        } catch (error) {
          logger.error(`Failed to parse backup data for key: ${key}`, error);
        }
      }
    }

    return {
      errors: errorLog,
      backups,
      browser: navigator.userAgent,
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error('Failed to generate error report:', error);
    return { error: 'No se pudo generar el reporte' };
  }
}

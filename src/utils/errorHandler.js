/**
 * Sistema centralizado de manejo de errores para el editor de flujos.
 * Proporciona funciones para capturar, clasificar, registrar y manejar errores
 * de manera coherente en toda la aplicación.
 */

// Constantes para tipos de errores
export const ERROR_TYPES = {
  AUTH: 'auth',              // Errores de autenticación
  NETWORK: 'network',        // Errores de red
  VALIDATION: 'validation',  // Errores de validación de datos
  API: 'api',                // Errores de API
  FLOW: 'flow',              // Errores específicos del editor de flujos
  RENDERING: 'rendering',    // Errores de renderizado
  STORAGE: 'storage',        // Errores de almacenamiento
  GENERAL: 'general'         // Errores generales
};

/**
 * Captura y clasifica un error
 * @param {Error} error - El objeto de error
 * @param {string} context - Contexto donde ocurrió el error
 * @returns {Object} Información clasificada sobre el error
 */
export function captureError(error, context = 'unknown') {
  // Registrar en consola para debugging
  console.error(`[${context}] Error:`, error);
  
  // Información básica del error
  const errorInfo = {
    originalError: error,
    message: error.message || 'Error desconocido',
    context,
    timestamp: Date.now(),
    type: ERROR_TYPES.GENERAL, // Tipo por defecto
    data: {}
  };
  
  // Clasificar error según sus características
  if (error.response) {
    // Error de respuesta HTTP
    const status = error.response.status;
    errorInfo.data.status = status;
    errorInfo.data.responseData = error.response.data;
    
    // Clasificar por código de estado
    if (status === 401 || status === 403) {
      errorInfo.type = ERROR_TYPES.AUTH;
      errorInfo.message = 'Sesión expirada o no autorizado';
    } else if (status === 404) {
      errorInfo.type = ERROR_TYPES.API;
      errorInfo.message = 'Recurso no encontrado';
    } else if (status === 422) {
      errorInfo.type = ERROR_TYPES.VALIDATION;
      errorInfo.message = 'Datos no válidos';
    } else if (status >= 500) {
      errorInfo.type = ERROR_TYPES.API;
      errorInfo.message = 'Error en el servidor';
    }
  } else if (error.request) {
    // Error de red (sin respuesta)
    errorInfo.type = ERROR_TYPES.NETWORK;
    errorInfo.message = 'Error de conexión. Verifica tu red.';
  } else if (error.message && error.message.includes('validateFlow')) {
    // Error de validación de flujo
    errorInfo.type = ERROR_TYPES.VALIDATION;
  } else if (error.message && error.message.includes('storage')) {
    // Error de almacenamiento
    errorInfo.type = ERROR_TYPES.STORAGE;
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
    path: null
  };
  
  switch (errorInfo.type) {
    case ERROR_TYPES.AUTH:
      // Limpiar token y redirigir a login
      localStorage.removeItem('access_token');
      actions.shouldRedirect = true;
      actions.path = '/login';
      break;
      
    case ERROR_TYPES.NETWORK:
      // Sugerir reintentar
      actions.shouldRetry = true;
      break;
      
    case ERROR_TYPES.VALIDATION:
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
      
    case ERROR_TYPES.FLOW:
      // Intentar recuperación automática
      actions.shouldRecover = true;
      break;
      
    case ERROR_TYPES.STORAGE:
      // Limpiar caché y reintentar
      actions.shouldClearCache = true;
      actions.shouldRetry = true;
      break;
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
      stackTrace: errorInfo.originalError?.stack
    };
    
    // Limitar a los últimos 20 errores
    errorLog.push(logEntry);
    if (errorLog.length > 20) {
      errorLog.shift();
    }
    
    // Guardar log actualizado
    localStorage.setItem('flow_error_log', JSON.stringify(errorLog));
  } catch (e) {
    console.warn('Error al guardar en registro de errores:', e);
  }
}

/**
 * Recupera datos de un respaldo local si está disponible
 * @param {string} backupId - ID del respaldo a recuperar
 * @returns {Object|null} Datos recuperados o null si no hay respaldo
 */
export function recoverFromBackup(backupId) {
  try {
    const backup = localStorage.getItem(backupId);
    if (backup) {
      return JSON.parse(backup);
    }
  } catch (e) {
    console.warn('Error al recuperar respaldo:', e);
  }
  return null;
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
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('flow_backup_')) {
        try {
          const backup = JSON.parse(localStorage.getItem(key));
          backups.push({
            id: key,
            timestamp: backup.timestamp,
            nodesCount: backup.nodes?.length || 0,
            edgesCount: backup.edges?.length || 0
          });
        } catch {}
      }
    });
    
    return {
      errors: errorLog,
      backups,
      browser: navigator.userAgent,
      timestamp: Date.now()
    };
  } catch (e) {
    console.error('Error al generar reporte:', e);
    return { error: 'No se pudo generar el reporte' };
  }
}

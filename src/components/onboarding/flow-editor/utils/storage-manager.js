/**
 * Utilidad para gestionar el almacenamiento local de forma segura
 * Evita errores de QuotaExceededError: The quota has been exceeded
 */

// Prefijo para todas las claves usadas por el editor de flujos
const STORAGE_PREFIX = 'plubot-flow-';

/**
 * Limpia las entradas antiguas del localStorage para evitar exceder la cuota
 * @param {number} maxEntries - Número máximo de entradas a mantener
 * @param {number} maxAgeMs - Edad máxima en milisegundos para las entradas (default: 1 hora)
 */
export function cleanupStorage(maxEntries = 50, maxAgeMs = 60 * 60 * 1000) {
  try {
    // Recopilar todas las claves que empiezan con nuestro prefijo
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key);
      }
    }

    // Si no hay suficientes entradas, no es necesario limpiar
    if (keys.length <= maxEntries) {
      return;
    }



    // Eliminar entradas antiguas basadas en timestamp
    const now = Date.now();
    const keysWithTimestamps = keys.map(key => {
      let timestamp = 0;
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const data = JSON.parse(value);
          timestamp = data.timestamp || 0;
        }
      } catch (e) {
        // Si no se puede analizar, asumir que es antiguo
        timestamp = 0;
      }
      return { key, timestamp };
    });

    // Ordenar por antigüedad (más antiguo primero)
    keysWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);

    // Eliminar entradas antiguas hasta que queden maxEntries
    const keysToRemove = keysWithTimestamps.slice(0, keysWithTimestamps.length - maxEntries);
    keysToRemove.forEach(({ key, timestamp }) => {
      // Eliminar si es más antiguo que maxAgeMs o si es necesario para llegar a maxEntries
      if (now - timestamp > maxAgeMs || keysWithTimestamps.length > maxEntries) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {}
}

/**
 * Guarda un valor en localStorage de forma segura
 * @param {string} key - Clave (se añadirá el prefijo automáticamente)
 * @param {any} value - Valor a guardar
 * @param {boolean} addTimestamp - Si se debe añadir un timestamp al valor
 * @returns {boolean} - true si se guardó correctamente, false en caso contrario
 */
export function safeSetItem(key, value, addTimestamp = true) {
  try {
    // Añadir prefijo a la clave
    const prefixedKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
    
    // Añadir timestamp si es necesario
    let processedValue = value;
    if (addTimestamp && typeof value === 'object') {
      processedValue = { ...value, timestamp: Date.now() };
    }
    
    // Convertir a string si es necesario
    const stringValue = typeof processedValue === 'string' 
      ? processedValue 
      : JSON.stringify(processedValue);
    
    // Intentar guardar
    localStorage.setItem(prefixedKey, stringValue);
    return true;
  } catch (error) {
    // Si se excede la cuota, limpiar y reintentar
    if (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014) {
      cleanupStorage();
      
      try {
        // Reintentar después de limpiar
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (retryError) {}
    } else {}

    
    return false;
  }
}

/**
 * Recupera un valor de localStorage de forma segura
 * @param {string} key - Clave (se añadirá el prefijo automáticamente si no está presente)
 * @param {any} defaultValue - Valor por defecto si no se encuentra la clave
 * @returns {any} - Valor recuperado o defaultValue
 */
export function safeGetItem(key, defaultValue = null) {
  try {
    // Añadir prefijo a la clave si no está presente
    const prefixedKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
    
    const value = localStorage.getItem(prefixedKey);
    if (value === null) {
      return defaultValue;
    }
    
    try {
      return JSON.parse(value);
    } catch (parseError) {
      // Si no se puede analizar, devolver el valor sin procesar
      return value;
    }
  } catch (error) {
    return defaultValue;
  }
}

// Exportar funciones principales
export default {
  cleanupStorage,
  safeSetItem,
  safeGetItem,
  prefix: STORAGE_PREFIX
};

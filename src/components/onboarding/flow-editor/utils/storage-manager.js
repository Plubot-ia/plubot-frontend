/**
 * Utilidad para gestionar el almacenamiento local de forma segura
 * Evita errores de QuotaExceededError: The quota has been exceeded
 */

// Prefijo para todas las claves usadas por el editor de flujos
const STORAGE_PREFIX = 'plubot-flow-';

/**
 * Recopila todas las claves del localStorage que empiezan con nuestro prefijo.
 * @returns {string[]} - Array de claves filtradas.
 */
function collectPrefixedKeys() {
  const keys = [];
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Determina si una entrada debe ser eliminada basándose en edad y límites.
 * @param {Object} params - Parámetros de validación.
 * @param {number} params.timestamp - Timestamp de la entrada.
 * @param {number} params.now - Timestamp actual.
 * @param {number} params.maxAgeMs - Edad máxima permitida.
 * @param {number} params.totalEntries - Total de entradas.
 * @param {number} params.maxEntries - Máximo de entradas permitidas.
 * @returns {boolean} - true si debe eliminarse.
 */
function shouldRemoveEntry({ timestamp, now, maxAgeMs, totalEntries, maxEntries }) {
  return now - timestamp > maxAgeMs || totalEntries > maxEntries;
}

/**
 * Limpia las entradas antiguas del localStorage para evitar exceder la cuota
 * @param {number} maxEntries - Número máximo de entradas a mantener
 * @param {number} maxAgeMs - Edad máxima en milisegundos para las entradas (default: 1 hora)
 */
export function cleanupStorage(maxEntries = 50, maxAgeMs = 60 * 60 * 1000) {
  try {
    // Recopilar todas las claves que empiezan con nuestro prefijo
    const keys = collectPrefixedKeys();

    // Si no hay suficientes entradas, no es necesario limpiar
    if (keys.length <= maxEntries) {
      return;
    }

    // Eliminar entradas antiguas basadas en timestamp
    const now = Date.now();
    const keysWithTimestamps = keys.map((key) => {
      let timestamp = 0;
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const data = JSON.parse(value);
          timestamp = data.timestamp ?? 0;
        }
      } catch {
        // Si no se puede analizar, asumir que es antiguo
        timestamp = 0;
      }
      return { key, timestamp };
    });

    // Ordenar por antigüedad (más antiguo primero)
    keysWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);

    // Eliminar entradas antiguas hasta que queden maxEntries
    const keysToRemove = keysWithTimestamps.slice(0, keysWithTimestamps.length - maxEntries);
    for (const { key, timestamp } of keysToRemove) {
      // Eliminar si es más antiguo que maxAgeMs o si es necesario para llegar a maxEntries
      if (
        shouldRemoveEntry({
          timestamp,
          now,
          maxAgeMs,
          totalEntries: keysWithTimestamps.length,
          maxEntries,
        })
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}

/**
 * Aplica el prefijo a una clave si no lo tiene ya.
 * @param {string} key - Clave a procesar.
 * @returns {string} - Clave con prefijo.
 */
function applyKeyPrefix(key) {
  return key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
}

/**
 * Procesa el valor añadiendo timestamp si es necesario.
 * @param {any} value - Valor a procesar.
 * @param {boolean} addTimestamp - Si añadir timestamp.
 * @returns {any} - Valor procesado.
 */
function processValueWithTimestamp(value, addTimestamp) {
  if (addTimestamp && typeof value === 'object') {
    return { ...value, timestamp: Date.now() };
  }
  return value;
}

/**
 * Convierte un valor a string para localStorage.
 * @param {any} value - Valor a convertir.
 * @returns {string} - Valor como string.
 */
function valueToString(value) {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Verifica si un error es de cuota excedida.
 * @param {Error} error - Error a verificar.
 * @returns {boolean} - true si es error de cuota.
 */
function isQuotaExceededError(error) {
  return error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014;
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
    const prefixedKey = applyKeyPrefix(key);

    // Añadir timestamp si es necesario
    const processedValue = processValueWithTimestamp(value, addTimestamp);

    // Convertir a string si es necesario
    const stringValue = valueToString(processedValue);

    // Intentar guardar
    localStorage.setItem(prefixedKey, stringValue);
    return true;
  } catch (error) {
    // Si se excede la cuota, limpiar y reintentar
    if (isQuotaExceededError(error)) {
      cleanupStorage();

      try {
        // Reintentar después de limpiar
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {}
    }

    return false;
  }
}

/**
 * Recupera un valor de localStorage de forma segura
 * @param {string} key - Clave (se añadirá el prefijo automáticamente si no está presente)
 * @param {any} defaultValue - Valor por defecto si no se encuentra la clave
 * @returns {any} - Valor recuperado o defaultValue
 */
export function safeGetItem(key, defaultValue) {
  try {
    // Añadir prefijo a la clave si no está presente
    const prefixedKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;

    const value = localStorage.getItem(prefixedKey);
    if (value === null) {
      return defaultValue;
    }

    try {
      return JSON.parse(value);
    } catch {
      // Si no se puede analizar, devolver el valor sin procesar
      return value;
    }
  } catch {
    return defaultValue;
  }
}

// Exportar funciones principales
const storageManager = {
  cleanupStorage,
  safeSetItem,
  safeGetItem,
  prefix: STORAGE_PREFIX,
};

export default storageManager;

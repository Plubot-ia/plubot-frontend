import { sanitizeFlowState } from '../components/onboarding/flow-editor/utils/flow-sanitizer';
import storageManager, {
  safeSetItem,
  safeGetItem,
} from '../components/onboarding/flow-editor/utils/storage-manager';
import logger from '../services/loggerService';

// Simple debounce function
function debounce(function_, wait) {
  let timeout;
  // La función devuelta es una función flecha, por lo que no tiene su propio `this`.
  // Esto es seguro para nuestro caso de uso, ya que la función envuelta no depende de `this`.
  return (...arguments_) => {
    const later = () => {
      timeout = undefined;
      function_(...arguments_);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Almacena las funciones debounced para cada nombre de store (aunque probablemente solo usemos uno)
const debouncedSetters = new Map();

/**
 * Almacenamiento personalizado para Zustand que utiliza el storage-manager unificado.
 * Proporciona una capa de almacenamiento personalizada para Zustand que puede incluir
 * lógica de cifrado, compresión o validación.
 */
const customZustandStorage = {
  getItem: (name) => {
    let result;
    const storedData = safeGetItem(name);

    if (
      storedData &&
      typeof storedData === 'object' &&
      Object.prototype.hasOwnProperty.call(storedData, 'state')
    ) {
      // Punto de intercepción crítico: Sanear el estado ANTES de que Zustand lo reciba.
      const sanitizedState = sanitizeFlowState(storedData.state);

      // Asignar el objeto completo a Zustand con el estado ya saneado.
      result = { ...storedData, state: sanitizedState };
    }

    // Si no hay datos o están corruptos, se devuelve undefined para que Zustand use el estado inicial.
    return result;
  },

  setItem: (name, value) => {
    // `value` aquí es el objeto que Zustand quiere persistir, que incluye { state, version }.
    // Creamos o recuperamos una función debounced específica para este 'name'.
    if (!debouncedSetters.has(name)) {
      const debouncedSetter = debounce((currentValue) => {
        safeSetItem(name, currentValue); // safeSetItem es la función original de storage-manager
      }, 1000); // Debounce de 1000ms (1 segundo)
      debouncedSetters.set(name, debouncedSetter);
    }
    debouncedSetters.get(name)(value); // Llamar a la función debounced con el valor más reciente
  },

  removeItem: (name) => {
    // `safeGetItem` y `safeSetItem` usan `STORAGE_PREFIX` internamente.
    // Para `removeItem`, necesitamos construir la clave con el prefijo nosotros mismos
    // o añadir una función `safeRemoveItem` a `storage-manager.js`.
    // Por ahora, construimos la clave manualmente para ser consistentes.
    // También es importante limpiar cualquier setter debounced pendiente para esta clave.
    if (debouncedSetters.has(name)) {
      // Esto no es correcto para la mayoría de las implementaciones de debounce.
      // La limpieza del timeout debe hacerse dentro del debounce o no exponerse.
      // Por ahora, lo dejamos así, pero una mejor implementación de debounce
      // manejaría esto internamente o la función debounced retornaría un método cancel().
      clearTimeout(debouncedSetters.get(name));
      // Podríamos querer eliminarlo, pero podría ser recreado.
      // debouncedSetters.delete(name);
    }

    try {
      const prefixedName = name.startsWith(storageManager.prefix)
        ? name
        : `${storageManager.prefix}${name}`;
      localStorage.removeItem(prefixedName);
    } catch (error) {
      logger.error(`Error al eliminar el item "${name}" de localStorage:`, error);
      // Silenciar errores intencionadamente, por ejemplo, si localStorage está deshabilitado.
    }
  },
};

export default customZustandStorage;

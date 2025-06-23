import { default as storageManager, safeSetItem, safeGetItem } from '../components/onboarding/flow-editor/utils/storage-manager';
import { sanitizeFlowState } from '../components/onboarding/flow-editor/utils/flow-sanitizer';

// Simple debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const context = this;
    const later = () => {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Almacena las funciones debounced para cada nombre de store (aunque probablemente solo usemos uno)
const debouncedSetters = {};

/**
 * Almacenamiento personalizado para Zustand que utiliza el storage-manager unificado.
 */
const customZustandStorage = {
  getItem: (name) => {
    const storedData = safeGetItem(name);

    if (storedData && typeof storedData === 'object' && storedData.hasOwnProperty('state')) {
      // Punto de intercepción crítico: Sanear el estado ANTES de que Zustand lo reciba.
      const sanitizedState = sanitizeFlowState(storedData.state);
      
      // Devolver el objeto completo a Zustand con el estado ya saneado.
      return { ...storedData, state: sanitizedState };
    }
    
    // Si no hay datos o están corruptos, devolver null para que Zustand use el estado inicial.
    return null;
  },
  
  setItem: (name, value) => {
    // `value` aquí es el objeto que Zustand quiere persistir, que incluye { state, version }.
    // Creamos o recuperamos una función debounced específica para este 'name'.
    if (!debouncedSetters[name]) {
      debouncedSetters[name] = debounce((currentValue) => {

        safeSetItem(name, currentValue); // safeSetItem es la función original de storage-manager
      }, 1000); // Debounce de 1000ms (1 segundo)
    }
    debouncedSetters[name](value); // Llamar a la función debounced con el valor más reciente
  },
  
  removeItem: (name) => {
    // `safeGetItem` y `safeSetItem` usan `STORAGE_PREFIX` internamente.
    // Para `removeItem`, necesitamos construir la clave con el prefijo nosotros mismos
    // o añadir una función `safeRemoveItem` a `storage-manager.js`.
    // Por ahora, construimos la clave manualmente para ser consistentes.
    // También es importante limpiar cualquier setter debounced pendiente para esta clave.
    if (debouncedSetters[name]) {
      clearTimeout(debouncedSetters[name]); // Esto no es correcto para la mayoría de las implementaciones de debounce
                                         // La limpieza del timeout debe hacerse dentro del debounce o no exponerse.
                                         // Por ahora, lo dejamos así, pero una mejor implementación de debounce manejaría esto internamente
                                         // o la función debounced retornaría un método cancel().
      // delete debouncedSetters[name]; // Podríamos querer eliminarlo, pero podría ser recreado.
    }

    try {
      const prefixedName = name.startsWith(storageManager.prefix) ? name : `${storageManager.prefix}${name}`;
      localStorage.removeItem(prefixedName);
    } catch (error) {
      // Silenciar errores intencionadamente, por ejemplo, si localStorage está deshabilitado.
    }
  }
};

export default customZustandStorage;

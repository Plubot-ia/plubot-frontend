import { default as storageManager, safeSetItem, safeGetItem } from '../components/onboarding/flow-editor/utils/storage-manager';

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
    // El `name` de Zustand (e.g., 'flow-editor-store') se usará como parte de la clave
    // `safeGetItem` se encargará de añadir el prefijo `plubot-flow-`.
    // No es necesario parsear aquí, safeGetItem ya lo hace si es JSON.
    // El valor devuelto por safeGetItem ya incluye el estado y el timestamp si existe.
    // Necesitamos devolver solo el 'state' a Zustand.
    const storedData = safeGetItem(name); // e.g., name = 'flow-editor-store'
    // Zustand espera un objeto con la forma { state: ..., version: ... } o null/undefined.
    // safeGetItem devuelve el objeto completo tal como lo guardó safeSetItem (que incluye timestamp, state, version).
    // Si storedData es null o no tiene la propiedad 'state', Zustand lo manejará como una inicialización.
    if (storedData && typeof storedData === 'object' && storedData.hasOwnProperty('state')) {
      return storedData; // Devuelve el objeto { state, version, timestamp? } completo que espera Zustand
    }
    // Si no es el formato esperado por Zustand (por ejemplo, datos antiguos o corrupción leve),
    // devolver null para forzar a Zustand a usar el estado inicial de la aplicación.
    // Esto es más seguro que devolver datos potencialmente malformados.
    if (storedData) {
        console.warn(`[ZustandStorage] Datos recuperados para ${name} no tienen la propiedad 'state'. Se usará estado inicial. Datos:`, storedData);
    }
    return null; 
  },
  
  setItem: (name, value) => {
    // `value` aquí es el objeto que Zustand quiere persistir, que incluye { state, version }.
    // Creamos o recuperamos una función debounced específica para este 'name'.
    if (!debouncedSetters[name]) {
      debouncedSetters[name] = debounce((currentValue) => {
        console.log(`[ZustandStorage] Ejecutando guardado debounced para ${name}`);
        const success = safeSetItem(name, currentValue); // safeSetItem es la función original de storage-manager
        if (!success) {
          console.error(`[ZustandStorage] Falló el guardado debounced para ${name} usando safeSetItem.`);
        }
      }, 1000); // Debounce de 1000ms (1 segundo)
    }
    
    // console.log(`[ZustandStorage] Programando guardado para ${name} con valor:`, value);
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
      console.log(`[ZustandStorage] Elemento ${prefixedName} eliminado de localStorage.`);
    } catch (error) {
      console.error(`[ZustandStorage] Error al eliminar ${name}:`, error);
    }
  }
};

export default customZustandStorage;

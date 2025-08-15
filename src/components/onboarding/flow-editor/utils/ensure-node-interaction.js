/**
 * ensure-node-interaction.js
 *
 * Utilidad especializada para garantizar que todos los nodos en el editor de flujos
 * sean siempre visibles, arrastrables y completamente interactivos.
 *
 * Esta solución aborda problemas comunes en ReactFlow donde los nodos pueden:
 * - Perder visibilidad
 * - Quedar bloqueados en una posición
 * - Tener propiedades CSS incorrectas que afectan su interactividad
 */

/**
 * Aplica correcciones de visibilidad e interactividad a todos los nodos
 * @param {boolean} force - Si es true, fuerza la corrección incluso si no parece necesario
 */
export const ensureNodesAreInteractive = (force = false) => {
  // Solo ejecutar optimizaciones iniciales o cuando se fuerza explícitamente
  // Esto evita el uso excesivo de recursos durante la operación normal
  if (
    !force &&
    globalThis.__lastNodeInteractionTime &&
    Date.now() - globalThis.__lastNodeInteractionTime < 10_000
  ) {
    // 10 segundos
    return; // Evitar optimizaciones demasiado frecuentes
  }

  // Registrar el tiempo de la última optimización
  globalThis.__lastNodeInteractionTime = Date.now();

  // Dar tiempo para que ReactFlow renderice los nodos
  setTimeout(() => {
    // Seleccionar todos los nodos en el editor
    const nodes = document.querySelectorAll('.react-flow__node');

    if (!nodes || nodes.length === 0) {
      // Si no se encuentran nodos, intentar de nuevo en un momento (solo si es forzado)
      if (force) {
        setTimeout(() => ensureNodesAreInteractive(true), 100);
      }
      return;
    }

    // El bucle para la corrección de nodos individuales está temporalmente deshabilitado para depuración.

    // También asegurar que los handles de conexión sean interactivos
    const handles = document.querySelectorAll('.react-flow__handle');
    for (const handle of handles) {
      handle.style.visibility = 'visible';
      handle.style.pointerEvents = 'all';
      handle.style.opacity = '1';
    }

    // Finalmente, asegurar que las aristas sean visibles
    const edges = document.querySelectorAll('.react-flow__edge');
    for (const edge of edges) {
      edge.style.visibility = 'visible';
      edge.style.display = 'block';
      edge.style.opacity = '1';
    }
  }, 50); // Pequeño retraso para asegurar que ReactFlow ha terminado su ciclo de renderizado
};

/**
 * Configura un observador de mutaciones para aplicar correcciones automáticamente
 * cuando se detectan cambios en el DOM relacionados con los nodos
 */
export const setupNodeInteractionObserver = () => {
  // Verificar si el observador ya existe
  if (globalThis.__nodeInteractionObserver) {
    return;
  }

  // Configurar un nuevo observador con tiempo de debounce para evitar optimizaciones excesivas
  let debounceTimer;

  const observer = new MutationObserver((mutations) => {
    let shouldFix = false;

    // Filtrar solo mutaciones que afecten a los nodos que se acaban de añadir
    // y no procesar cada pequeña mutación de estilo
    for (const mutation of mutations) {
      // Solo verificar adiciones de nodos - esto reduce drásticamente la sobrecarga
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (
            node.classList &&
            (node.classList.contains('react-flow__node') ||
              node.classList.contains('react-flow__edge'))
          ) {
            shouldFix = true;
            break;
          }
        }
      }

      if (shouldFix) break; // Salir del bucle si ya encontramos algo que arreglar
    }

    // Usar debounce para evitar múltiples llamadas en sucesión rápida
    if (shouldFix) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        ensureNodesAreInteractive();
      }, 300); // Esperar 300ms antes de aplicar optimizaciones
    }
  });

  // Comenzar a observar el documento - MÁS SELECTIVO
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    // No observar cambios de atributos - esto es crítico para el rendimiento
    attributes: false,
  });

  // Guardar referencia para evitar duplicados
  globalThis.__nodeInteractionObserver = observer;

  // Aplicar correcciones solo una vez al inicio
  ensureNodesAreInteractive(true);

  // Establecer un intervalo MUY INFRECUENTE
  const interval = setInterval(() => {
    ensureNodesAreInteractive();
  }, 30_000); // Verificar cada 30 segundos en lugar de cada 5 segundos

  // Guardar referencia para poder limpiarlo si es necesario
  globalThis.__nodeInteractionInterval = interval;
};

/**
 * Detiene el observador y el intervalo si ya no son necesarios
 */
export const stopNodeInteractionObserver = () => {
  if (globalThis.__nodeInteractionObserver) {
    globalThis.__nodeInteractionObserver.disconnect();
    globalThis.__nodeInteractionObserver = undefined;
  }

  if (globalThis.__nodeInteractionInterval) {
    clearInterval(globalThis.__nodeInteractionInterval);
    globalThis.__nodeInteractionInterval = undefined;
  }
};

// Exportar una función para uso directo en componentes
export default function useNodeInteraction() {
  return {
    ensureNodesAreInteractive,
    setupNodeInteractionObserver,
    stopNodeInteractionObserver,
  };
}

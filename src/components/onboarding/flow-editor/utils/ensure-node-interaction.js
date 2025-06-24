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
  if (!force && window.__lastNodeInteractionTime &&
      Date.now() - window.__lastNodeInteractionTime < 10000) { // 10 segundos
    return; // Evitar optimizaciones demasiado frecuentes
  }

  // Registrar el tiempo de la última optimización
  window.__lastNodeInteractionTime = Date.now();

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


    // Aplicar correcciones a cada nodo
    nodes.forEach(node => {
      /* TEMPORALMENTE COMENTADO PARA DEPURACIÓN
      // 1. Garantizar visibilidad
      node.style.visibility = 'visible';
      node.style.display = 'block';
      node.style.opacity = '1';

      // 2. Garantizar que el nodo sea arrastrable
      node.style.pointerEvents = 'all';
      node.style.userSelect = 'none';

      // 3. Eliminar cualquier transformación que pueda estar causando problemas
      if (force) {
        // Solo limpiar transform si estamos forzando la corrección
        // o si detectamos una transformación que coloca el nodo en (0,0)
        const transform = node.style.transform;
        if (transform && (transform.includes('translate(0px, 0px)') ||
            transform.includes('matrix(') ||
            transform.includes('scale(0)') ||
            transform.includes('none'))) {
          // Limpiar solo transformaciones problemáticas
          // node.style.transform = ''; // <-- Comentado para evitar conflictos con React Flow
        }
      }

      // 4. Eliminar cualquier posición absoluta incorrecta

      if (node.style.position === 'absolute' &&
          node.style.top === '0px' &&
          node.style.left === '0px') {
        node.style.position = '';
        node.style.top = '';
        node.style.left = '';
      }


      // 5. Asegurar que el z-index permita la interacción
      node.style.zIndex = '5';
      */
    });

    // También asegurar que los handles de conexión sean interactivos
    const handles = document.querySelectorAll('.react-flow__handle');
    handles.forEach(handle => {
      handle.style.visibility = 'visible';
      handle.style.pointerEvents = 'all';
      handle.style.opacity = '1';
    });

    // Finalmente, asegurar que las aristas sean visibles
    const edges = document.querySelectorAll('.react-flow__edge');
    edges.forEach(edge => {
      edge.style.visibility = 'visible';
      edge.style.display = 'block';
      edge.style.opacity = '1';
    });

  }, 50); // Pequeño retraso para asegurar que ReactFlow ha terminado su ciclo de renderizado
};

/**
 * Configura un observador de mutaciones para aplicar correcciones automáticamente
 * cuando se detectan cambios en el DOM relacionados con los nodos
 */
export const setupNodeInteractionObserver = () => {
  // Verificar si el observador ya existe
  if (window.__nodeInteractionObserver) {
    return;
  }

  // Configurar un nuevo observador con tiempo de debounce para evitar optimizaciones excesivas
  let debounceTimer = null;

  const observer = new MutationObserver((mutations) => {
    let shouldFix = false;

    // Filtrar solo mutaciones que afecten a los nodos que se acaban de añadir
    // y no procesar cada pequeña mutación de estilo
    for (const mutation of mutations) {
      // Solo verificar adiciones de nodos - esto reduce drásticamente la sobrecarga
      if (mutation.addedNodes && mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (node.classList &&
              (node.classList.contains('react-flow__node') ||
               node.classList.contains('react-flow__edge'))) {
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
  window.__nodeInteractionObserver = observer;

  // Aplicar correcciones solo una vez al inicio
  ensureNodesAreInteractive(true);

  // Establecer un intervalo MUY INFRECUENTE
  const interval = setInterval(() => {
    ensureNodesAreInteractive();
  }, 30000); // Verificar cada 30 segundos en lugar de cada 5 segundos

  // Guardar referencia para poder limpiarlo si es necesario
  window.__nodeInteractionInterval = interval;


};

/**
 * Detiene el observador y el intervalo si ya no son necesarios
 */
export const stopNodeInteractionObserver = () => {
  if (window.__nodeInteractionObserver) {
    window.__nodeInteractionObserver.disconnect();
    window.__nodeInteractionObserver = null;

  }

  if (window.__nodeInteractionInterval) {
    clearInterval(window.__nodeInteractionInterval);
    window.__nodeInteractionInterval = null;

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

/**
 * initPerformanceMonitor.js
 *
 * Este archivo se encarga de inicializar el monitor de rendimiento.
 * Puede ser importado en el punto de entrada de la aplicación (main.jsx o index.js)
 * para activar el monitor de rendimiento sin tener que modificar los componentes existentes.
 */

import performanceMonitor from './PerformanceMonitor';

/**
 * Inicializa el monitor de rendimiento
 */
export function initPerformanceMonitor() {
  // Esperar a que el DOM esté completamente cargado
  if (document.readyState === 'complete') {
    initIfInEditor();
  } else {
    window.addEventListener('load', () => {
      initIfInEditor();
    });
  }
}

/**
 * Verifica si estamos en la página del editor de flujos antes de inicializar
 */
function initIfInEditor() {
  // Verificar si estamos en la página del editor de flujos
  // Podemos verificar la URL o la presencia de elementos específicos del editor
  const isInEditor =
    globalThis.location.pathname.includes('/flow-editor') ||
    document.querySelector('.flow-editor-container') !== null;

  if (isInEditor) {
    performanceMonitor.init();
  } else {
    // No estamos en el editor, no se inicializa el monitor
  }

  return performanceMonitor;
}

// Exportar también la instancia del monitor para uso directo

// Inicializar automáticamente si se importa directamente
initPerformanceMonitor();

export { default as performanceMonitor } from './PerformanceMonitor';

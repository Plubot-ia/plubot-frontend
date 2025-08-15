/**
 * PerformanceMonitor.js
 *
 * Este script se encarga de monitorear el rendimiento de la aplicación y mostrar
 * las estadísticas de rendimiento utilizando el componente PerformanceStats.
 * Se inyecta dinámicamente en la aplicación sin necesidad de modificar los componentes existentes.
 */

class PerformanceMonitor {
  constructor() {
    this.container = undefined;
    this.root = undefined;
    this.isInitialized = false;
  }

  /**
   * Inicializa el monitor de rendimiento
   */
  init() {
    // Componente desactivado ya que ahora las estadísticas están integradas en el menú de Opciones
    // No inicializamos el componente flotante para evitar que interfiera con otros elementos
    this.isInitialized = true;
  }

  /**
   * Maneja las pulsaciones de teclas para mostrar/ocultar el monitor
   * @param {KeyboardEvent} event - Evento de teclado
   */
  handleKeyPress(event) {
    // Alt + P para mostrar/ocultar el monitor
    if (event.altKey && event.key === 'p') {
      this.toggleVisibility();
    }
  }

  /**
   * Configura el botón de rendimiento en el menú de opciones
   */
  setupPerformanceButton() {
    // Observar el DOM para detectar cuando se agrega el indicador de rendimiento
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          const performanceIndicator = document.querySelector('.performance-indicator');
          if (
            performanceIndicator &&
            !Object.hasOwn(performanceIndicator.dataset, 'monitorInitialized')
          ) {
            performanceIndicator.dataset.monitorInitialized = 'true';
            performanceIndicator.addEventListener('click', () => {
              this.toggleVisibility();
            });
          }
        }
      }
    });

    // Iniciar la observación del documento
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Alterna la visibilidad del monitor de rendimiento
   */
  toggleVisibility() {
    if (!this.container) return;

    const isVisible = this.container.style.display !== 'none';
    this.container.style.display = isVisible ? 'none' : 'block';
  }
}

// Crear una instancia del monitor y exportarla
const performanceMonitor = new PerformanceMonitor();

// Inicializar el monitor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  performanceMonitor.init();
});

// Exportar la instancia para uso en otros componentes
export default performanceMonitor;

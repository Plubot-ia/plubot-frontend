/**
 * PerformanceMonitor.js
 * 
 * Este script se encarga de monitorear el rendimiento de la aplicación y mostrar
 * las estadísticas de rendimiento utilizando el componente PerformanceStats.
 * Se inyecta dinámicamente en la aplicación sin necesidad de modificar los componentes existentes.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import PerformanceStats from './PerformanceStats';

class PerformanceMonitor {
  constructor() {
    this.container = null;
    this.root = null;
    this.isInitialized = false;
  }

  /**
   * Inicializa el monitor de rendimiento
   */
  init() {
    // Componente desactivado ya que ahora las estadísticas están integradas en el menú de Opciones
    console.log('[PerformanceMonitor] Monitor desactivado. Las estadísticas están ahora en el menú de Opciones');
    
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
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          const performanceIndicator = document.querySelector('.performance-indicator');
          if (performanceIndicator && !performanceIndicator.hasAttribute('data-monitor-initialized')) {
            performanceIndicator.setAttribute('data-monitor-initialized', 'true');
            performanceIndicator.addEventListener('click', () => {
              this.toggleVisibility();
            });
            console.log('[PerformanceMonitor] Botón de rendimiento configurado');
          }
        }
      });
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
    
    console.log(`[PerformanceMonitor] ${isVisible ? 'Ocultado' : 'Mostrado'}`);
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

/**
 * Parche de rendimiento para el editor de flujos
 * Aplica optimizaciones agresivas para mejorar el rendimiento
 */

// Configuración global de rendimiento
const PERFORMANCE_CONFIG = {
  // Niveles de calidad (0: bajo, 1: medio, 2: alto)
  qualityLevel: 1,
  
  // Habilitar/deshabilitar efectos visuales
  enableAnimations: true,
  enableShadows: true,
  enableGradients: true,
  
  // Optimizaciones de renderizado
  useHardwareAcceleration: true,
  debounceResize: true,
  throttleScroll: true,
  
  // Debug
  logPerformance: false,
  measureFPS: false
};

/**
 * Aplica las optimizaciones de rendimiento al cargar el editor
 */
export function applyPerformancePatches() {
  if (typeof window === 'undefined') return;
  
  // Aplicar estilos CSS para optimización
  applyPerformanceStyles();
  
  // Aplicar polyfills de rendimiento
  applyPerformancePolyfills();
  
  // Configurar monitoreo de rendimiento
  if (PERFORMANCE_CONFIG.measureFPS) {
    setupFPSMeter();
  }
  
  // Configurar el modo de rendimiento ultra
  setupUltraPerformanceMode();
  
  if (PERFORMANCE_CONFIG.logPerformance) {
    console.log('[PerformancePatch] Optimizaciones aplicadas');
  }
}

/**
 * Aplica estilos CSS para optimización de rendimiento
 */
function applyPerformanceStyles() {
  const styleId = 'plubot-performance-styles';
  
  // Si ya existen los estilos, no hacer nada
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Optimizaciones de renderizado */
    .react-flow__nodes,
    .react-flow__edges,
    .react-flow__viewport {
      transform: translateZ(0);
      backface-visibility: hidden;
      perspective: 1000px;
      transform-style: preserve-3d;
    }
    
    /* Reducir calidad de renderizado para mejor rendimiento */
    .react-flow__nodes *,
    .react-flow__edges * {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: -moz-crisp-edges;
      image-rendering: pixelated;
    }
    
    /* Deshabilitar selección de texto durante el arrastre */
    .react-flow__pane {
      user-select: none;
      -webkit-user-select: none;
    }
    
    /* Optimizar animaciones - Excluir aristas personalizadas */
    .react-flow__edge:not(.elite-edge) .react-flow__edge-path,
    .react-flow__edge:not(.elite-edge) .react-flow__edge-text {
      transition: opacity 0.2s ease-out;
    }
    
    /* Modo ultra rendimiento - Excluir aristas personalizadas */
    .performance-mode .react-flow__edge:not(.elite-edge) .react-flow__edge-path,
    .performance-mode .react-flow__edge:not(.elite-edge) .react-flow__edge-text,
    .performance-mode .react-flow__node-default,
    .performance-mode .react-flow__node-input,
    .performance-mode .react-flow__node-output,
    .performance-mode .react-flow__node-default {
      transition: none !important;
      animation: none !important;
      filter: none !important;
      box-shadow: none !important;
      opacity: 1 !important;
    }
    
    .performance-mode .elite-edge {
      stroke-width: 1px !important;
      stroke-dasharray: none !important;
      animation: none !important;
    }
    
    /* Optimizar fuentes */
    .react-flow__node {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-smooth: always;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Aplica polyfills de rendimiento
 */
function applyPerformancePolyfills() {
  // Polyfill para requestAnimationFrame
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
      return window.webkitRequestAnimationFrame ||
             window.mozRequestAnimationFrame ||
             function(callback) {
               window.setTimeout(callback, 1000 / 60);
             };
    })();
  }
  
  // Polyfill para performance.now()
  if (!window.performance) {
    window.performance = {};
  }
  
  if (!window.performance.now) {
    let nowOffset = Date.now();
    
    if (performance.timing && performance.timing.navigationStart) {
      nowOffset = performance.timing.navigationStart;
    }
    
    window.performance.now = function now() {
      return Date.now() - nowOffset;
    };
  }
}

/**
 * Configura el medidor de FPS
 */
function setupFPSMeter() {
  if (window.FPSMeter) return;
  
  const fpsMeterContainer = document.createElement('div');
  fpsMeterContainer.style.position = 'fixed';
  fpsMeterContainer.style.bottom = '10px';
  fpsMeterContainer.style.right = '10px';
  fpsMeterContainer.style.zIndex = '9999';
  fpsMeterContainer.style.padding = '5px 10px';
  fpsMeterContainer.style.background = 'rgba(0, 0, 0, 0.7)';
  fpsMeterContainer.style.color = '#fff';
  fpsMeterContainer.style.borderRadius = '4px';
  fpsMeterContainer.style.fontFamily = 'monospace';
  fpsMeterContainer.style.fontSize = '12px';
  
  const fpsMeter = document.createElement('div');
  fpsMeter.id = 'fps-meter';
  fpsMeter.textContent = 'FPS: --';
  
  fpsMeterContainer.appendChild(fpsMeter);
  document.body.appendChild(fpsMeterContainer);
  
  let lastTime = performance.now();
  let frameCount = 0;
  let lastFpsUpdate = 0;
  let fps = 0;
  
  function updateFPS() {
    const now = performance.now();
    const delta = now - lastTime;
    
    frameCount++;
    
    // Actualizar el contador de FPS cada segundo
    if (now - lastFpsUpdate >= 1000) {
      fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
      document.getElementById('fps-meter').textContent = `FPS: ${fps}`;
      
      // Cambiar el color según el rendimiento
      const fpsMeterElement = document.getElementById('fps-meter');
      if (fpsMeterElement) {
        if (fps < 30) {
          fpsMeterElement.style.color = '#ff6b6b';
        } else if (fps < 50) {
          fpsMeterElement.style.color = '#ffd93d';
        } else {
          fpsMeterElement.style.color = '#6cff6c';
        }
      }
      
      frameCount = 0;
      lastFpsUpdate = now;
    }
    
    lastTime = now;
    requestAnimationFrame(updateFPS);
  }
  
  requestAnimationFrame(updateFPS);
}

/**
 * Configura el modo de rendimiento ultra
 */
function setupUltraPerformanceMode() {
  // Verificar si ya existe el botón de rendimiento
  if (document.getElementById('ultra-performance-toggle')) return;
  
  // Crear botón de alternar rendimiento
  const toggleButton = document.createElement('button');
  toggleButton.id = 'ultra-performance-toggle';
  toggleButton.textContent = '⚡ Rendimiento';
  toggleButton.style.position = 'fixed';
  toggleButton.style.bottom = '20px';
  toggleButton.style.left = '20px';
  toggleButton.style.zIndex = '1000';
  toggleButton.style.padding = '8px 16px';
  toggleButton.style.border = 'none';
  toggleButton.style.borderRadius = '4px';
  toggleButton.style.background = '#4a90e2';
  toggleButton.style.color = 'white';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.fontSize = '14px';
  toggleButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  toggleButton.style.transition = 'all 0.2s ease';
  
  // Manejar clic en el botón
  toggleButton.addEventListener('click', () => {
    const isUltraMode = document.body.classList.toggle('performance-mode');
    toggleButton.textContent = isUltraMode ? '🎨 Calidad' : '⚡ Rendimiento';
    toggleButton.style.background = isUltraMode ? '#ff6b6b' : '#4a90e2';
    
    // Guardar preferencia en localStorage
    if (isUltraMode) {
      localStorage.setItem('plubot-performance-mode', 'ultra');
    } else {
      localStorage.removeItem('plubot-performance-mode');
    }
    
    // Forzar actualización de componentes
    window.dispatchEvent(new Event('resize'));
  });
  
  // Aplicar estado inicial
  if (localStorage.getItem('plubot-performance-mode') === 'ultra') {
    document.body.classList.add('performance-mode');
    toggleButton.textContent = '🎨 Calidad';
    toggleButton.style.background = '#ff6b6b';
  }
  
  document.body.appendChild(toggleButton);
}

// Aplicar parches al cargar el script
if (typeof window !== 'undefined') {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPerformancePatches);
  } else {
    applyPerformancePatches();
  }
}

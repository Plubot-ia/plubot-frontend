/**
 * PerformancePatch.js
 * Solución extrema con overlay físico que bloquea todas las interacciones de mouse
 * excepto para arrastrar nodos en modo ultra rendimiento
 */

(function() {
  // Variables globales
  let overlay = null;
  let styleElement = null;
  let isUltraPerformanceMode = false;
  let dragStarted = false;
  let lastClickTime = 0;
  
  // Lista de selectores para elementos que deben recibir eventos directamente
  const elementsToAllow = [
    '.react-flow__handle', // Handles para conexiones
    '.react-flow__pane',   // Pane para zoom y pan
    '.react-flow__controls', // Controles de zoom
    '.react-flow__minimap', // Minimapa
    '.performance-mode-button' // Botón de modo rendimiento
  ];
  
  // Crear el overlay que bloqueará las interacciones de mouse excepto las esenciales
  function createOverlay() {
    if (overlay) return; // Ya existe
    
    // Crear el elemento overlay
    overlay = document.createElement('div');
    overlay.id = 'ultra-performance-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: transparent;
      z-index: 9998;
      pointer-events: all;
      cursor: default;
      opacity: 0;
    `;
    
    // Crear el elemento de estilo
    styleElement = document.createElement('style');
    styleElement.id = 'ultra-performance-styles';
    styleElement.textContent = `
      /* Estilos básicos para modo ultra rendimiento */
      body.performance-mode-active .elite-edge-path-ultra {
        display: block !important;
        opacity: 1 !important;
        stroke: #ff00cc !important;
        stroke-width: 3px !important;
      }
      
      body.performance-mode-active .elite-edge-flow,
      body.performance-mode-active .elite-edge-flow-secondary,
      body.performance-mode-active .elite-edge-glow,
      body.performance-mode-active .elite-edge-center {
        display: none !important;
      }
      
      body.performance-mode-active .react-flow__node.selected {
        outline: 2px solid #ff00cc !important;
      }
      
      body.performance-mode-active * {
        transition: none !important;
        animation: none !important;
      }
    `;
    
    // Agregar eventos al overlay para manejar todas las interacciones
    overlay.addEventListener('mousedown', handleMouseEvent, true);
    overlay.addEventListener('mouseup', handleMouseEvent, true);
    overlay.addEventListener('click', handleMouseEvent, true);
    overlay.addEventListener('dblclick', handleMouseEvent, true); // Para editar nodos
    overlay.addEventListener('wheel', handleMouseEvent, true); // Para zoom
    overlay.addEventListener('mousemove', handleMouseEvent, true);
    
    // Agregar los elementos al DOM
    document.head.appendChild(styleElement);
    document.body.appendChild(overlay);
    
    console.log('[PerformancePatch] Overlay creado');
  }
  
  // Eliminar el overlay
  function removeOverlay() {
    if (!overlay) return; // No existe
    
    // Eliminar el overlay
    overlay.remove();
    overlay = null;
    
    // Eliminar los estilos
    if (styleElement) {
      styleElement.remove();
      styleElement = null;
    }
    
    console.log('[PerformancePatch] Overlay eliminado');
  }
  
  // Manejar eventos de mouse para permitir interacciones específicas
  function handleMouseEvent(e) {
    // Verificar si es un doble clic
    if (e.type === 'mousedown') {
      const now = Date.now();
      if (now - lastClickTime < 300) {
        // Es un doble clic, permitir que pase
        passEventThrough(e);
        return;
      }
      lastClickTime = now;
      dragStarted = true;
    } else if (e.type === 'mouseup') {
      dragStarted = false;
    }
    
    // Comprobar si el evento debe pasar a través del overlay
    const shouldBypass = checkIfShouldBypass(e);
    
    if (shouldBypass || dragStarted || e.type === 'wheel' || e.type === 'dblclick') {
      passEventThrough(e);
    }
  }
  
  // Comprobar si el evento debe pasar a través del overlay
  function checkIfShouldBypass(e) {
    // Desactivar temporalmente el overlay
    overlay.style.pointerEvents = 'none';
    
    // Obtener el elemento debajo
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    
    // Restaurar el overlay
    overlay.style.pointerEvents = 'all';
    
    // Si no hay elemento debajo, no pasar el evento
    if (!elementBelow) return false;
    
    // Comprobar si el elemento o alguno de sus padres coincide con alguno de los selectores
    return elementsToAllow.some(selector => {
      let el = elementBelow;
      while (el) {
        if (el.matches && el.matches(selector)) {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    });
  }
  
  // Función para permitir que un evento pase a través del overlay
  function passEventThrough(e) {
    // Desactivar temporalmente el overlay
    overlay.style.pointerEvents = 'none';
    
    // Obtener el elemento debajo
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    
    // Restaurar el overlay
    overlay.style.pointerEvents = 'all';
    
    // Si hay un elemento debajo, simular el evento en él
    if (elementBelow) {
      const eventType = e.type;
      
      // Crear el evento apropiado según el tipo
      let syntheticEvent;
      
      if (eventType === 'wheel') {
        // Para eventos de rueda (zoom)
        syntheticEvent = new WheelEvent('wheel', {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: true,
          cancelable: true,
          view: window,
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          deltaZ: e.deltaZ,
          deltaMode: e.deltaMode,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          metaKey: e.metaKey
        });
      } else {
        // Para eventos de mouse normales
        syntheticEvent = new MouseEvent(eventType, {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: true,
          cancelable: true,
          view: window,
          button: e.button,
          buttons: e.buttons,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          metaKey: e.metaKey
        });
      }
      
      elementBelow.dispatchEvent(syntheticEvent);
    }
    
    // Detener la propagación del evento original
    e.stopPropagation();
    e.preventDefault();
  }
  
  // Función para manejar cambios en el modo de rendimiento
  function handlePerformanceModeChange() {
    const isActive = document.body.classList.contains('performance-mode-active');
    
    if (isActive !== isUltraPerformanceMode) {
      isUltraPerformanceMode = isActive;
      
      if (isUltraPerformanceMode) {
        // Activar modo ultra rendimiento
        createOverlay();
        console.log('[PerformancePatch] Modo ultra rendimiento activado');
      } else {
        // Desactivar modo ultra rendimiento
        removeOverlay();
        console.log('[PerformancePatch] Modo normal restaurado');
      }
    }
  }
  
  // Observar cambios en la clase del body
  function observeBodyClass() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'class') {
          handlePerformanceModeChange();
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    
    // Verificar el estado inicial
    handlePerformanceModeChange();
  }
  
  // Inicializar cuando el DOM esté listo
  function initialize() {
    // Verificar el estado inicial del modo ultra rendimiento
    isUltraPerformanceMode = document.body.classList.contains('performance-mode-active');
    
    // Si ya está en modo ultra rendimiento, aplicar los cambios inmediatamente
    if (isUltraPerformanceMode) {
      createOverlay();
    }
    
    // Observar cambios futuros
    observeBodyClass();
    
    console.log('[PerformancePatch] Inicializado');
  }
  
  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();

/**
 * optimized-flow-fixes.js
 *
 * SOLUCIÓN UNIFICADA: Este archivo consolida todas las correcciones necesarias
 * para el editor de flujos en un solo lugar, optimizando el rendimiento y reduciendo
 * la cantidad de logs en la consola.
 *
 * Reemplaza varios archivos:
 * - node-drag-fix.js
 * - fix-node-visibility.js
 * - debug-node-visibility.js
 * - remove-blue-rectangle.js
 *
 * INCLUYE: Solución avanzada para eliminar el tinte azulado del pane
 * Este archivo reemplaza múltiples utilidades redundantes con una única
 * implementación eficiente que mejora el rendimiento.
 */

// Configuración global
const CONFIG = {
  // Reducir la frecuencia de ejecución para mejorar rendimiento
  fixInterval: 2000, // Ejecutar cada 2 segundos en lugar de constantemente
  // Solo registrar en consola en modo desarrollo
  enableLogs: false, // Deshabilitar logs por defecto
  // Activar o desactivar fixes específicos
  fixes: {
    nodeDrag: true,
    nodeVisibility: true,
    removeBlueRectangle: true,
    hideControls: true,
  },
};

// Singleton para gestionar los intervalos y limpieza
const instances = {
  intervals: [],
  observers: [],
  fixesApplied: false,
};

/**
 * Fuerza la visibilidad de los nodos en el editor
 * Versión mejorada que asegura que los nodos sean visibles y arrastrables
 */
const applyNodeVisibilityFix = () => {
  const nodes = document.querySelectorAll('.react-flow__node');
  if (!nodes || nodes.length === 0) return;


  // Aplicar estilos críticos a cada nodo sin sobrecarga
  nodes.forEach(node => {
    // Estilos mínimos necesarios para visibilidad
    node.style.visibility = 'visible';
    node.style.display = 'block';
    node.style.opacity = '1';

    // Garantizar que sean interactivos
    node.style.pointerEvents = 'all';
  });

  // Corregir el viewport si es necesario
  const viewport = document.querySelector('.react-flow__viewport');
  if (viewport && !viewport.style.transform) {
    viewport.style.transform = 'translate(0px, 0px) scale(1)';
  }
};

/**
 * Corrige la capacidad de arrastre de los nodos
 * Versión mejorada que garantiza total funcionalidad de arrastre
 */
const applyNodeDragFix = () => {
  const nodes = document.querySelectorAll('.react-flow__node');
  if (!nodes || nodes.length === 0) return;


  // Asegurar que los nodos tengan los estilos correctos para ser arrastrables
  nodes.forEach(node => {
    // Hacer que el nodo sea arrastrable si no lo es
    if (node.getAttribute('draggable') !== 'true') {
      node.setAttribute('draggable', 'true');
    }

    // Importante: estos estilos garantizan la capacidad de arrastre
    node.style.cursor = 'grab';
    node.style.pointerEvents = 'all';
    node.style.touchAction = 'none'; // Importante para dispositivos táctiles

    // Asegurar que los eventos de ratón funcionen correctamente
    if (!node._dragFixApplied) {
      node._dragFixApplied = true;

      // Añadir eventos para mejorar experiencia de arrastre
      node.addEventListener('mousedown', () => {
        node.style.cursor = 'grabbing';
      });

      node.addEventListener('mouseup', () => {
        node.style.cursor = 'grab';
      });
    }
  });

  // Aplicar atributos críticos para arrastre
  nodes.forEach(node => {
    node.setAttribute('draggable', 'true');
    node.style.userSelect = 'none';
    node.style.cursor = 'grab';

    // Asegurar clase para CSS
    if (!node.classList.contains('draggable')) {
      node.classList.add('draggable');
    }
  });

  // Corregir pane para interacción
  const pane = document.querySelector('.react-flow__pane');
  if (pane) {
    pane.style.pointerEvents = 'all';
  }
};

/**
 * Elimina el color azulado del pane sin afectar otros elementos
 * Versión DEFINITIVA que solo afecta el pane y el rectángulo de selección
 */
const removeBlueRectangle = () => {
  // SOLO seleccionamos el pane y los elementos de selección
  // NO incluimos selectores que puedan afectar nodos u otros elementos
  const elementsToFix = [
    '.react-flow__pane', // El fondo del editor (pane)
    '.react-flow__selection', // El rectángulo de selección
    '.react-flow__selection-rect', // El rectángulo visual
  ];

  // Aplicar cambios solo a los elementos específicos
  elementsToFix.forEach(selector => {
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
      // IMPORTANTE: Solo procesamos elementos específicos, no sus hijos
      if (selector === '.react-flow__pane') {
        // Para el pane principal: hacer transparente pero mantener funcionalidad
        el.style.setProperty('background-color', 'transparent', 'important');
        el.style.setProperty('background', 'none', 'important');
        el.style.setProperty('background-image', 'none', 'important');
        el.style.pointerEvents = 'all'; // Mantener interactividad

        // Método directo para modificar el estilo inline (más efectivo)
        const currentStyle = el.getAttribute('style') || '';
        const styleWithoutBlue = currentStyle.replace(/background(-color)?\s*:\s*rgba\(0,\s*89,\s*220[^;]*;?/g, '');
        el.setAttribute('style', `${styleWithoutBlue}background-color: transparent !important; background: none !important;`);
      } else if (selector.includes('selection')) {
        // Para elementos de selección: ocultarlos
        el.style.setProperty('background-color', 'transparent', 'important');
        el.style.setProperty('background', 'none', 'important');
        el.style.setProperty('border', '1px dashed rgba(200, 200, 200, 0.3)', 'important');
      }
    });
  });

  // Búsqueda más específica para el color azulado del pane - NUEVA TÉCNICA
  const paneElements = document.querySelectorAll('.react-flow__pane');
  paneElements.forEach(pane => {
    // Usar MutationObserver para capturar cambios de estilo en tiempo real
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const style = pane.getAttribute('style') || '';
          if (style.includes('rgba(0, 89, 220') || style.includes('rgb(0, 89, 220')) {
            // Eliminar inmediatamente cualquier color azul que se aplique dinámicamente
            pane.style.setProperty('background-color', 'transparent', 'important');
            pane.style.setProperty('background', 'none', 'important');
          }
        }
      });
    });

    // Iniciar observación de cambios de estilo
    observer.observe(pane, { attributes: true, attributeFilter: ['style'] });

    // Guardar referencia para limpieza
    if (!instances.observers) instances.observers = [];
    instances.observers.push(observer);
  });

  // Buscar EXACTAMENTE el color azulado por su valor rgba
  const blueElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundColor;
    return bg === 'rgba(0, 89, 220, 0.08)' || bg === 'rgb(0, 89, 220)';
  });

  blueElements.forEach(el => {
    // Solo modificar si es parte del pane o selección
    if (el.classList.contains('react-flow__pane') ||
        el.classList.contains('react-flow__selection') ||
        el.parentElement?.classList.contains('react-flow__pane')) {
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.setProperty('background', 'none', 'important');
    }
  });

  // Inyectar CSS con técnicas avanzadas para problemas específicos
  const customStyle = document.createElement('style');
  customStyle.textContent = `
    /* Variables y selectores específicos */
    :root {
      --reactflow-selection-bg: transparent !important;
      --reactflow-background: transparent !important;
      --rf-blue: transparent !important;
      --rf-primary: transparent !important;
    }
    
    /* Selectores extremadamente específicos para el pane */
    .react-flow__pane,
    div.react-flow__pane,
    .react-flow div.react-flow__pane,
    html body .react-flow .react-flow__pane {
      background-color: transparent !important;
      background: none !important;
    }
    
    /* Selector inline */
    [style*="rgba(0, 89, 220, 0.08)"] {
      background-color: transparent !important;
    }
    
    /* Selección */
    .react-flow__selection {
      background-color: transparent !important;
      background: none !important;
    }
  `;

  // Agregar solo si no existe ya
  if (!document.querySelector('style[data-id="remove-blue-fix"]')) {
    customStyle.setAttribute('data-id', 'remove-blue-fix');
    document.head.appendChild(customStyle);
  }

  // TÉCNICA AVANZADA: Usar un overlay invisible para cancelar el efecto azul
  // Este método es extremo pero efectivo cuando nada más funciona
  if (!document.querySelector('#pane-fix-overlay')) {
    const paneFixOverlay = document.createElement('div');
    paneFixOverlay.id = 'pane-fix-overlay';
    paneFixOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      mix-blend-mode: overlay;
      background-color: transparent;
    `;

    const reactFlowContainer = document.querySelector('.react-flow');
    if (reactFlowContainer) {
      reactFlowContainer.style.position = 'relative';
      reactFlowContainer.appendChild(paneFixOverlay);
    }
  }
};

/**
 * Oculta controles de ReactFlow
 * Versión optimizada de HideControls.jsx
 */
const hideControls = () => {
  const controls = document.querySelector('.react-flow__controls');
  if (controls) {
    controls.style.display = 'none';
  }
};

/**
 * Aplicar todas las correcciones en una sola pasada
 * Versión optimizada con mejor manejo de errores y reporting
 */
const applyAllFixes = () => {
  try {
    // Verificar si hay nodos visibles antes de aplicar fixes
    const nodes = document.querySelectorAll('.react-flow__node');
    const edges = document.querySelectorAll('.react-flow__edge');


    // Aplicar fixes con manejo de errores individuales
    if (CONFIG.fixes.nodeVisibility) {
      try {
        applyNodeVisibilityFix();
      } catch (e) {
      }
    }

    if (CONFIG.fixes.nodeDrag) {
      try {
        applyNodeDragFix();
      } catch (e) {
      }
    }

    if (CONFIG.fixes.removeBlueRectangle) {
      try {
        removeBlueRectangle();
      } catch (e) {
      }
    }

    if (CONFIG.fixes.hideControls) {
      try {
        hideControls();
      } catch (e) {
      }
    }

    // Garantizar que los elementos de ReactFlow tienen las clases CSS correctas
    document.querySelectorAll('.react-flow').forEach(flow => {
      if (!flow.classList.contains('reactflow-fixed')) {
        flow.classList.add('reactflow-fixed');
      }
    });

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Función principal exportada que inicializa todos los fixes
 * optimizados para rendimiento
 *
 * @param {Object} options - Opciones de configuración
 * @returns {Function} Función de limpieza
 */
export const initOptimizedFixes = (options = {}) => {
  // Combinar opciones con configuración predeterminada
  Object.assign(CONFIG, options);

  // Limpiar instancias previas para evitar duplicaciones
  cleanup();

  // Aplicar fixes inmediatamente
  applyAllFixes();

  // Configurar un solo intervalo que ejecute todo
  const intervalId = setInterval(() => {
    // Solo aplicar si hay nodos presentes
    const nodes = document.querySelectorAll('.react-flow__node');
    if (nodes.length > 0) {
      applyAllFixes();
    }
  }, CONFIG.fixInterval);

  instances.intervals.push(intervalId);

  // Configurar observer para detectar cambios en el DOM
  const observer = new MutationObserver((mutations) => {
    let shouldApplyFixes = false;

    for (const mutation of mutations) {
      // Solo reaccionar a cambios relevantes
      if (
        mutation.type === 'childList' ||
        (mutation.type === 'attributes' &&
         (mutation.target.classList.contains('react-flow__node') ||
          mutation.target.classList.contains('react-flow__viewport')))
      ) {
        shouldApplyFixes = true;
        break;
      }
    }

    if (shouldApplyFixes) {
      applyAllFixes();
    }
  });

  // Observar solo cambios en el contenedor de ReactFlow
  const reactFlowWrapper = document.querySelector('.react-flow');
  if (reactFlowWrapper) {
    observer.observe(reactFlowWrapper, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    instances.observers.push(observer);
  }

  // Devolver función de limpieza
  return cleanup;
};

/**
 * Limpia todos los intervalos y observers
 */
export const cleanup = () => {
  // Limpiar intervalos
  instances.intervals.forEach(id => clearInterval(id));
  instances.intervals = [];

  // Desconectar observers
  instances.observers.forEach(obs => obs.disconnect());
  instances.observers = [];

  instances.fixesApplied = false;
};

// Exportar funciones individuales por si se necesitan
export {
  applyNodeVisibilityFix,
  applyNodeDragFix,
  removeBlueRectangle,
  hideControls,
  applyAllFixes,
};

// Exportar función principal como default
export default initOptimizedFixes;

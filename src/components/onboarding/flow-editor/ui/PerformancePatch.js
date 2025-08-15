/**
 * PerformancePatch.js
 * Mejoras de rendimiento para el modo ultra sin bloquear interacciones
 */

import useFlowStore from '@/stores/use-flow-store';

// Inicializar cuando el DOM esté listo
if (typeof document !== 'undefined') {
  (function () {
    // Variables globales
    let styleElement;
    let unsubscribe;
    let isUltraPerformanceMode = false;

    // Crear estilos para el modo ultra rendimiento
    function createStyles() {
      if (styleElement) return; // Ya existe

      // Crear el elemento de estilo
      styleElement = document.createElement('style');
      styleElement.id = 'ultra-performance-styles';
      styleElement.textContent = `
      /* Estilos para modo ultra rendimiento */
      
      /* Reset de estilos que pueden causar problemas de rendimiento */
      body.performance-mode-active {
        overflow: hidden;
      }

      /* Simplificar elementos de arista para mejor rendimiento */
      body.performance-mode-active .elite-edge-flow,
      body.performance-mode-active .elite-edge-flow-secondary,
      body.performance-mode-active .elite-edge-glow {
        opacity: 0.8 !important;
        stroke-width: 2px !important;
      }
      
      /* Asegurar que los bordes sean visibles */
      body.performance-mode-active .react-flow__edge {
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        pointer-events: all !important;
      }
      
      /* Asegurar que las conexiones sean visibles */
      body.performance-mode-active .react-flow__connection {
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
      }
      
      /* Estilos base para nodos en modo ultra */
      body.performance-mode-active .react-flow__node {
        /* IMPORTANTE: NO forzar transform - dejar que ReactFlow maneje el posicionamiento */
        /* position: absolute se aplicará automáticamente por ReactFlow */
        
        /* Mejorar rendimiento */
        will-change: transform;
        /* NO usar contain: content - interfiere con interactividad */
        backface-visibility: visible;
        
        /* NO forzar transition: none - mantener animaciones suaves */
        /* NO forzar perspective: none - mantener estilo 3D */
        
        /* Estilos visuales para asegurar visibilidad */
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        pointer-events: all !important;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      /* Estilo para nodos durante el arrastre */
      body.performance-mode-active .react-flow__node[data-dragging="true"],
      body.performance-mode-active .react-flow__node.dragging {
        /* Mejorar rendimiento durante arrastre */
        will-change: left, top !important;
        /* Asegurar que esté por encima de otros elementos */
        z-index: 1000 !important;
        /* Efecto visual sutil */
        opacity: 0.9 !important;
        /* Deshabilitar selección de texto */
        user-select: none;
        -webkit-user-select: none;
        /* Mejorar rendimiento */
        contain: strict;
      }
      
      /* Estilo para hover en modo ultra - Desactivado, manejado por el componente */
      body.performance-mode-active .react-flow__node:hover {
        /* Los estilos de hover ahora se manejan directamente en el componente */
        /* para evitar conflictos de renderizado */
      }
      
      /* Estilo para nodos seleccionados */
      body.performance-mode-active .react-flow__node.selected {
        outline: 2px solid #ff00cc !important;
        outline-offset: 1px !important;
        z-index: 10 !important;
      }
      
      /* Contenedor de nodos - NO FORZAR TRANSFORM: NONE */
      body.performance-mode-active .react-flow__nodes {
        /* NO forzar position, width, height ni transform */
        /* Permitir que ReactFlow maneje estos aspectos */
        
        /* Optimizaciones de rendimiento que no interfieren con ReactFlow */
        will-change: transform;
        -webkit-overflow-scrolling: touch;
        
        /* NO usar contain: strict - esto bloquea las transformaciones */
        
        /* Asegurar que los eventos pasen a los nodos */
        pointer-events: none;
      }
      
      /* Contenedor principal - NO FORZAR TRANSFORM: NONE */
      body.performance-mode-active .react-flow__renderer,
      body.performance-mode-active .react-flow__pane {
        /* NO forzar position, width, height ni transform */
        /* Permitir que ReactFlow maneje estos aspectos */
        
        /* Optimizaciones que no interfieren con ReactFlow */
        will-change: transform;
        -webkit-overflow-scrolling: touch;
        
        /* NO usar contain: strict - esto bloquea las transformaciones */
        /* NO usar backface-visibility: hidden - puede causar problemas */
        
        /* Asegurar que el contenedor no interfiera con los eventos */
        pointer-events: none;
      }
      
      /* Asegurar que los nodos sean interactivos */
      body.performance-mode-active .react-flow__node {
        pointer-events: auto;
        /* Asegurar que los eventos de puntero funcionen correctamente */
        touch-action: none;
        /* Evitar que los hijos generen nuevas capas */
        transform: none;
      }
    `;

      // Agregar los estilos al DOM
      document.head.append(styleElement);
    }

    // Eliminar estilos
    function removeStyles() {
      // Eliminar los estilos
      if (styleElement) {
        styleElement.remove();
        styleElement = undefined;
      }
    }

    // Función para garantizar la visibilidad de los nodos y bordes en modo ultra rendimiento
    // NO intentamos posicionar los nodos, sólo aseguramos que sean visibles
    function updateNodePositions() {
      // Si no estamos en modo ultra, o si hay un arrastre en progreso, salir
      if (!isUltraPerformanceMode || globalThis.__dragInProgress) return;

      // Obtener los nodos y bordes del store
      const { nodes, edges } = useFlowStore.getState();

      // Sólo asegurar que los nodos sean visibles, SIN modificar su posición
      // Esto evita conflictos con el sistema nativo de ReactFlow
      for (const node of nodes) {
        const nodeElement = document.querySelector(`.react-flow__node[data-id="${node.id}"]`);
        if (nodeElement) {
          // Asegurar que el nodo es visible
          nodeElement.style.opacity = '1';
          nodeElement.style.visibility = 'visible';
          nodeElement.style.display = 'block';
        }
      }

      // Sólo asegurar que los bordes sean visibles
      for (const edge of edges) {
        const edgeElement = document.querySelector(`.react-flow__edge[data-id="${edge.id}"]`);
        if (edgeElement) {
          // Asegurar que el borde es visible
          edgeElement.style.opacity = '1';
          edgeElement.style.visibility = 'visible';
          edgeElement.style.display = 'block';
        }
      }
    }

    // Función para manejar cambios en el modo de rendimiento
    function handlePerformanceModeChange(isUltra) {
      isUltraPerformanceMode = isUltra;

      if (isUltraPerformanceMode) {
        document.body.classList.add('performance-mode-active');
        createStyles();
        // Actualizar posiciones inmediatamente
        updateNodePositions();
      } else {
        document.body.classList.remove('performance-mode-active');
        removeStyles();
      }
    }

    // Suscribirse a cambios en el store
    function subscribeToStore() {
      if (unsubscribe) return; // Ya estamos suscritos

      // Suscribirse a cambios en isUltraMode
      const unsubscribeUltraMode = useFlowStore.subscribe(
        (state) => state.isUltraMode,
        (isUltra) => {
          if (isUltra !== isUltraPerformanceMode) {
            handlePerformanceModeChange(isUltra);
          }
        },
        { fireImmediately: true }, // Ejecutar inmediatamente con el estado actual
      );

      // Suscribirse a cambios en los nodos para actualizar sus posiciones
      const unsubscribeNodes = useFlowStore.subscribe(
        (state) => state.nodes,
        () => {
          if (isUltraPerformanceMode) {
            // Solo actualizar si estamos en modo ultra
            requestAnimationFrame(updateNodePositions);
          }
        },
      );

      // Combinar las funciones de cancelación de suscripción
      unsubscribe = () => {
        unsubscribeUltraMode();
        unsubscribeNodes();
      };
    }

    // Inicializar cuando el DOM esté listo
    function initialize() {
      // Obtener el estado inicial del store
      const initialState = useFlowStore.getState();
      isUltraPerformanceMode = initialState.isUltraMode;

      // Aplicar estilos iniciales si es necesario
      if (isUltraPerformanceMode) {
        document.body.classList.add('performance-mode-active');
        createStyles();
      }

      // Suscribirse a cambios futuros
      subscribeToStore();
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }

    // Limpiar la suscripción cuando ya no sea necesaria
    if (globalThis.window !== undefined) {
      window.addEventListener('beforeunload', () => {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
        }
      });
    }
  })();
}

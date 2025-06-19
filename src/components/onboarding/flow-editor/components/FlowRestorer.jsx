import React, { useEffect } from 'react';
import useFlowStore from '@/stores/useFlowStore';

/**
 * FlowRestorer - Componente para restaurar completamente la funcionalidad del editor de flujos
 * Recupera la visualización correcta de nodos y la funcionalidad de interacción
 */
const FlowRestorer = () => {
  useEffect(() => {

    
    // Paso 1: Crear estilos globales que sobrescriban cualquier interferencia
    const createGlobalStyles = () => {
      // Eliminar cualquier estilo anterior
      const oldStyle = document.getElementById('flow-restorer-styles');
      if (oldStyle) oldStyle.remove();
      
      const style = document.createElement('style');
      style.id = 'flow-restorer-styles';
      style.innerHTML = `
        /* Garantizar que el viewport funcione correctamente */
        .react-flow__viewport {
          transform-origin: 0 0 !important;
          will-change: transform !important;
          pointer-events: none !important;
        }
        
        /* Garantizar que los nodos sean visibles e interactivos */
        .react-flow__node {
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: all !important;
          z-index: 10 !important;
          user-select: none !important;
        }
        
        /* Garantizar que las aristas sean visibles */
        .react-flow__edge {
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: stroke !important;
          z-index: 5 !important;
        }
        
        /* Garantizar que el pane reciba eventos de mouse para pan/zoom */
        .react-flow__pane {
          pointer-events: all !important;
          z-index: 1 !important;
          cursor: grab !important;
        }
        
        /* Garantizar que los controles sean visibles e interactivos */
        .react-flow__controls {
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: all !important;
          z-index: 15 !important;
        }
        
        /* Forzar visibilidad de handles para conexiones */
        .react-flow__handle {
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: all !important;
          z-index: 12 !important;
        }
        
        /* Asegurar que la selección funcione */
        .react-flow__selection {
          visibility: visible !important;
          pointer-events: none !important;
          z-index: 8 !important;
        }
        
        /* Desactivar cualquier fix anterior que pueda interferir */
        .force-positioned, .node-force-positioned {
          position: relative !important;
          transform: translate(var(--x, 0px), var(--y, 0px)) !important;
        }
      `;
      document.head.appendChild(style);

    };
    
    // Paso 2: Función para validar y corregir nodos
    const validateAndRepairNodes = () => {
      const nodes = useFlowStore.getState().nodes || [];
      if (!nodes.length) return;
      

      
      // Crear posiciones únicas para evitar apilamiento
      const usedPositions = new Set();
      const getUniquePosition = (baseX = 300, baseY = 200) => {
        const offset = 80;
        let x = baseX;
        let y = baseY;
        
        // Intentar hasta 20 veces encontrar una posición única
        for (let i = 0; i < 20; i++) {
          const posKey = `${x},${y}`;
          if (!usedPositions.has(posKey)) {
            usedPositions.add(posKey);
            return { x, y };
          }
          // Incrementar en diagonal para evitar apilamiento
          x += offset;
          y += offset;
        }
        
        // Si todo falla, usar valores aleatorios
        return {
          x: Math.floor(300 + Math.random() * 500),
          y: Math.floor(200 + Math.random() * 300)
        };
      };
      
      // Validar y corregir cada nodo
      const repairedNodes = nodes.map(node => {
        // Verificar si tiene posición válida
        const hasValidPosition = 
          node.position && 
          typeof node.position.x === 'number' && !isNaN(node.position.x) &&
          typeof node.position.y === 'number' && !isNaN(node.position.y);
        
        // Generar posición válida si es necesario
        const position = hasValidPosition 
          ? { x: Math.round(node.position.x), y: Math.round(node.position.y) }
          : getUniquePosition();
        
        // Añadir la posición al conjunto de usadas
        usedPositions.add(`${position.x},${position.y}`);
        
        // Retornar nodo corregido
        return {
          ...node,
          position,
          draggable: true,
          selectable: true,
          connectable: true,
          style: {
            ...node.style,
            visibility: 'visible',
            opacity: 1
          }
        };
      });
      
      // Actualizar los nodos en el store
      useFlowStore.getState().setNodes(repairedNodes);

    };
    
    // Paso 3: Función para restaurar la interactividad completa
    const restoreInteractivity = () => {
      // Obtener la instancia de ReactFlow
      const reactFlowInstance = useFlowStore.getState().reactFlowInstance;
      if (!reactFlowInstance) {
        console.warn('[FlowRestorer] No se pudo obtener la instancia de ReactFlow');
        return;
      }
      

      
      try {
        // Reiniciar el zoom para activar el viewport
        setTimeout(() => {
          reactFlowInstance.zoomTo(0.99);
          setTimeout(() => {
            reactFlowInstance.zoomTo(1);

          }, 100);
        }, 200);
      } catch (error) {
        console.error('[FlowRestorer] Error al reiniciar zoom:', error);
      }
    };
    
    // Paso 4: Secuencia de ejecución con tiempos adecuados
    const executeRestoration = () => {
      // Primero crear los estilos globales
      createGlobalStyles();
      
      // Desactivar cualquier CSS anterior que pueda interferir
      try {
        const styleSheets = document.styleSheets;
        for (let i = 0; i < styleSheets.length; i++) {
          try {
            const sheet = styleSheets[i];
            if (sheet.href && (
              sheet.href.includes('fix-transform') || 
              sheet.href.includes('reset-transform')
            )) {
              sheet.disabled = true;

            }
          } catch (e) {
            // Algunas hojas pueden ser inaccesibles por CORS
          }
        }
      } catch (e) {
        console.warn('[FlowRestorer] Error al desactivar hojas de estilo:', e);
      }
      
      // Después validar y reparar los nodos
      setTimeout(validateAndRepairNodes, 100);
      
      // Finalmente restaurar la interactividad
      setTimeout(restoreInteractivity, 500);
      
      // Repetir periódicamente para mantener la funcionalidad
      const interval = setInterval(() => {
        validateAndRepairNodes();
        // No repetimos restoreInteractivity para evitar interferir con el zoom del usuario
      }, 3000);
      
      return () => clearInterval(interval);
    };
    
    // Iniciar la secuencia de restauración
    return executeRestoration();
  }, []);
  
  return null; // Componente invisible
};

export default FlowRestorer;

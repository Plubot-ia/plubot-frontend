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
      const oldStyle = document.querySelector('#flow-restorer-styles');
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
      document.head.append(style);
    };

    // Paso 2: Función para validar y corregir nodos
    const validateAndRepairNodes = () => {
      const nodes = useFlowStore.getState().nodes || [];
      if (nodes.length === 0) return;

      const usedPositions = new Set();
      const getUniquePosition = (baseX = 300, baseY = 200) => {
        const offset = 80;
        let x = baseX;
        let y = baseY;

        for (let index = 0; index < 20; index++) {
          const posKey = `${x},${y}`;
          if (!usedPositions.has(posKey)) {
            usedPositions.add(posKey);
            return { x, y };
          }
          x += offset;
          y += offset;
        }

        return {
          x: Math.floor(300 + Math.random() * 500),
          y: Math.floor(200 + Math.random() * 300),
        };
      };

      const repairedNodes = nodes.map((node) => {
        const hasValidPosition =
          node.position &&
          typeof node.position.x === 'number' &&
          !isNaN(node.position.x) &&
          typeof node.position.y === 'number' &&
          !isNaN(node.position.y);

        const position = hasValidPosition
          ? { x: Math.round(node.position.x), y: Math.round(node.position.y) }
          : getUniquePosition();

        usedPositions.add(`${position.x},${position.y}`);

        return {
          ...node,
          position,
          draggable: true,
          selectable: true,
          connectable: true,
          style: {
            ...node.style,
            visibility: 'visible',
            opacity: 1,
          },
        };
      });

      useFlowStore.getState().setNodes(repairedNodes);
    };

    // Paso 3: Función para restaurar la interactividad completa
    const restoreInteractivity = () => {
      const { reactFlowInstance } = useFlowStore.getState();
      if (!reactFlowInstance) {
        return;
      }

      try {
        setTimeout(() => {
          reactFlowInstance.zoomTo(0.99);
          setTimeout(() => {
            reactFlowInstance.zoomTo(1);
          }, 100);
        }, 200);
      } catch {
        // Silently fail
      }
    };

    // Paso 4: Secuencia de ejecución con tiempos adecuados
    const executeRestoration = () => {
      createGlobalStyles();

      try {
        const { styleSheets } = document;
        for (const sheet of styleSheets) {
          try {
            if (
              sheet.href &&
              (sheet.href.includes('fix-transform') ||
                sheet.href.includes('reset-transform'))
            ) {
              sheet.disabled = true;
            }
          } catch {
            // Silently fail
          }
        }
      } catch {
        // Silently fail
      }

      setTimeout(validateAndRepairNodes, 100);

      setTimeout(restoreInteractivity, 500);

      const interval = setInterval(() => {
        validateAndRepairNodes();
      }, 3000);

      return () => clearInterval(interval);
    };

    return executeRestoration();
  }, []);

  return null; // Componente invisible
};

export default FlowRestorer;

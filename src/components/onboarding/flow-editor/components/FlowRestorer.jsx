import { useEffect } from 'react';

import useFlowStore from '@/stores/use-flow-store';

// LCG pseudo-random number generator extraído para evitar sonarjs/no-nested-functions
// Seguro para uso no criptográfico en posicionamiento de nodos
const createLCG = () => {
  let seed = Date.now();
  const a = 1_664_525;
  const c = 1_013_904_223;
  const m = 2 ** 32;
  return () => {
    seed = (a * seed + c) % m;
    return seed / m;
  };
};

// Helper para zoom secuencial extraído para evitar sonarjs/no-nested-functions
const performSequentialZoom = (reactFlowInstance) => {
  reactFlowInstance.zoomTo(0.99);
  setTimeout(() => {
    reactFlowInstance.zoomTo(1);
  }, 100);
};

// Helper para crear estilos CSS de restauración del editor de flujos
// Extrae ~60 líneas del template CSS para reducir max-lines-per-function
const createFlowRestorerCSS = () => `
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

// Helper para validar y reparar nodos con posiciones inválidas
// Extrae ~60 líneas de lógica compleja para reducir max-lines-per-function
const validateAndRepairNodes = () => {
  const nodes = useFlowStore.getState().nodes ?? [];
  if (nodes.length === 0) return;

  const usedPositions = new Set();
  // Usar generador LCG extraído al scope externo
  const lcg = createLCG();

  const getUniquePosition = (baseX = 300, baseY = 200) => {
    const offset = 80;
    let x = baseX;
    let y = baseY;

    for (let index = 0; index < 20; index += 1) {
      const positionKey = `${x},${y}`;
      if (!usedPositions.has(positionKey)) {
        usedPositions.add(positionKey);
        return { x, y };
      }
      x += offset;
      y += offset;
    }

    // Fallback to a random position if no unique spot is found after 20 attempts.
    return {
      x: Math.floor(300 + lcg() * 500),
      y: Math.floor(200 + lcg() * 300),
    };
  };

  const repairedNodes = nodes.map((node) => {
    const hasValidPosition =
      node.position &&
      typeof node.position.x === 'number' &&
      !Number.isNaN(node.position.x) &&
      typeof node.position.y === 'number' &&
      !Number.isNaN(node.position.y);

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
      style.innerHTML = createFlowRestorerCSS();
      document.head.append(style);
    };

    // Paso 2: Validar y corregir nodos usando helper externo

    // Paso 3: Función para restaurar la interactividad completa
    const restoreInteractivity = () => {
      const { reactFlowInstance } = useFlowStore.getState();
      if (!reactFlowInstance) {
        return;
      }

      try {
        setTimeout(() => {
          performSequentialZoom(reactFlowInstance);
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
              (sheet.href.includes('fix-transform') || sheet.href.includes('reset-transform'))
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

  // Componente invisible
};

export default FlowRestorer;

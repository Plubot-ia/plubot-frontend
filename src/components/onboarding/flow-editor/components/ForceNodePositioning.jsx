import React, { useEffect } from 'react';

import useFlowStore from '@/stores/useFlowStore';

/**
 * Componente de corrección de emergencia para forzar el posicionamiento correcto de nodos
 * Este componente aplica posicionamiento directo vía CSS inline a cada nodo
 * VERSIÓN DIRECTA: Enfoque más agresivo pero que sabemos que funciona para mostrar los nodos
 */
const ForceNodePositioning = () => {
  useEffect(() => {
    // Crear CSS global para garantizar que las transformaciones básicas funcionen
    const createGlobalStyles = () => {
      const style = document.createElement('style');
      style.id = 'force-node-positioning-styles';
      style.innerHTML = `
        /* Asegurar que todos los nodos sean visibles */
        .react-flow__node {
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: all !important;
          z-index: 5 !important;
        }
        
        /* Asegurar que todas las aristas sean visibles */
        .react-flow__edge {
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 4 !important;
        }
        
        /* Permitir que el viewport funcione correctamente */
        .react-flow__viewport {
          transform-origin: 0 0 !important;
          will-change: transform !important;
        }
        
        /* Clase especial para nodos posicionados por este componente */
        .node-force-positioned {
          position: absolute !important;
          transform: none !important;
        }
      `;
      document.head.append(style);
    };

    // Aplicar los estilos globales
    createGlobalStyles();

    // IMPORTANTE: Deshabilitar cualquier CSS anterior que pueda estar interfiriendo
    const disablePreviousFixes = () => {
      // Buscar y desactivar hojas de estilo que puedan estar interfiriendo
      const { styleSheets } = document;
      for (const sheet of styleSheets) {
        try {
          if (
            sheet.href &&
            (sheet.href.includes('fix-transform') ||
              sheet.href.includes('reset-transform'))
          ) {
            // Deshabilitar la hoja de estilo problemática
            sheet.disabled = true;
          }
        } catch {}
      }
    };

    // Desactivar fixes anteriores
    disablePreviousFixes();

    // Función para posicionar los nodos directamente
    const forcePositionNodes = () => {
      // Obtener TODOS los nodos, incluyendo los más recientes
      const nodes = useFlowStore.getState().nodes || [];
      if (nodes.length === 0) return;

      // Crear un mapa de nodos para acceso rápido
      const nodeMap = {};
      for (const node of nodes) {
        nodeMap[node.id] = node; // Incluimos todos los nodos, incluso si no tienen posición válida
      }

      // NUEVO: Preparar los nodos para actualización en el store para que ReactFlow los maneje bien
      const updatedNodes = nodes.map((node) => ({
        ...node,
        // Asegurar que tenga una posición válida
        position: {
          x: Math.round(node.position?.x || 200 + Math.random() * 200),
          y: Math.round(node.position?.y || 200 + Math.random() * 200),
        },
        // Habilitar interactividad
        draggable: true,
        selectable: true,
        connectable: true,
        // Asegurar visibilidad
        style: {
          ...node.style,
          visibility: 'visible',
          opacity: 1,
        },
      }));

      // Actualizar los nodos en el store
      useFlowStore.getState().setNodes(updatedNodes);

      // Esperar un poco para asegurar que los elementos están en el DOM
      setTimeout(() => {
        // Seleccionar todos los elementos de nodo
        const nodeElements = document.querySelectorAll('.react-flow__node');
        if (nodeElements.length === 0) {
          return;
        }

        // Aplicar posicionamiento directo vía CSS inline
        for (const element of nodeElements) {
          const nodeId = element.dataset.id;
          const node = nodeMap[nodeId];

          if (node) {
            // Aplicar posición directamente en el DOM
            element.style.position = 'absolute';
            element.style.left = `${node.position.x}px`;
            element.style.top = `${node.position.y}px`;
            element.style.transform = 'none';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.pointerEvents = 'all';
            element.style.zIndex = '5';

            // Marcar como posicionado por esta utilidad
            element.classList.add('node-force-positioned');
          }
        }

        // Asegurar que las aristas sean visibles
        const edgeElements = document.querySelectorAll('.react-flow__edge');
        for (const element of edgeElements) {
          element.style.visibility = 'visible';
          element.style.opacity = '1';
        }

        // RESTAURAR LA INTERACTIVIDAD DE REACTFLOW
        try {
          const { reactFlowInstance } = useFlowStore.getState();
          if (reactFlowInstance) {
            // Restaurar el viewport para que funcione el zoom
            const viewport = document.querySelector('.react-flow__viewport');
            if (viewport) {
              // Si no tiene transformación, establecer una por defecto
              const currentTransform = viewport.style.transform;
              if (!currentTransform || currentTransform === 'none') {
                viewport.style.transform = 'translate(0px, 0px) scale(1)';
              }

              // Propiedades críticas para que funcione la interactividad
              viewport.style.transformOrigin = '0 0';
              viewport.style.willChange = 'transform';
              viewport.style.pointerEvents = 'none';
            }

            // IMPORTANTE: Arreglar el sistema de drag & drop
            const pane = document.querySelector('.react-flow__pane');
            if (pane) {
              // Habilitar eventos de puntero en el pane
              pane.style.pointerEvents = 'all';
              pane.style.zIndex = '1';
            }

            // Habilitar los controles de zoom
            const controls = document.querySelector('.react-flow__controls');
            if (controls) {
              controls.style.visibility = 'visible';
              controls.style.opacity = '1';
              controls.style.pointerEvents = 'all';
              controls.style.zIndex = '10';
            }

            // Intentar ejecutar un zoom suave para re-inicializar el viewport
            try {
              // No usamos fitView() para no alterar posiciones, solo un zoom suave
              reactFlowInstance.zoomTo(0.999);
              setTimeout(() => {
                reactFlowInstance.zoomTo(1);
              }, 10);
            } catch {}
          }
        } catch {}
      }, 300);
    };

    // Ejecutar la función inmediatamente
    forcePositionNodes();

    // Ejecutar también cuando cambian los nodos
    const unsubscribe = useFlowStore.subscribe(
      (state) => state.nodes,
      (nodes) => {
        if (nodes && nodes.length > 0) {
          // Esperar un poco para que ReactFlow procese primero los cambios
          setTimeout(forcePositionNodes, 50);
        }
      },
    );

    // Aplicar cada 2 segundos para asegurar que las posiciones se mantengan
    const interval = setInterval(forcePositionNodes, 2000);

    // Limpieza al desmontar
    return () => {
      clearInterval(interval);
      unsubscribe();

      // Eliminar estilos globales al desmontar
      const styleElement = document.querySelector(
        '#force-node-positioning-styles',
      );
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // Este componente no renderiza nada visible
};

export default ForceNodePositioning;

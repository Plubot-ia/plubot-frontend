/**
 * @file useEdgeTimingFix.js
 * @description Hook especializado para resolver ReactFlow Error #008 mediante verificación
 * de handles en el DOM antes de permitir que ReactFlow procese edges
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUpdateNodeInternals } from 'reactflow';

import useFlowStore from '../../../../stores/use-flow-store';

/**
 * Hook para resolver timing issues entre handles y edges en ReactFlow
 *
 * PROBLEMA: ReactFlow procesa edges antes de que los handles estén montados en el DOM
 *
 * SOLUCIÓN DEFINITIVA: Verificar que todos los handles críticos estén en el DOM
 * antes de permitir que ReactFlow procese los edges
 */
export const useEdgeTimingFix = () => {
  const updateNodeInternals = useUpdateNodeInternals();
  const [handlesReady, setHandlesReady] = useState(false);
  const checkAttempts = useRef(0);
  const maxAttempts = 5;

  // OPTIMIZED: Only subscribe to isLoaded to avoid re-renders on node/edge changes
  const isLoaded = useFlowStore((state) => state.isLoaded);

  // Función para verificar si todos los handles críticos están en el DOM
  const checkHandlesInDOM = useCallback(() => {
    // OPTIMIZED: Get nodes from store only when needed
    const { nodes } = useFlowStore.getState();
    const criticalNodes = nodes.filter((node) =>
      ['start', 'message', 'decision', 'end'].includes(node.type),
    );

    if (criticalNodes.length === 0) return false;

    // Verificar handles específicos por tipo de nodo
    const requiredHandles = [];

    for (const node of criticalNodes) {
      switch (node.type) {
        case 'start': {
          requiredHandles.push(`[data-handleid="output"][data-nodeid="${node.id}"]`);
          break;
        }
        case 'message': {
          requiredHandles.push(
            `[data-handleid="input"][data-nodeid="${node.id}"]`,
            `[data-handleid="output"][data-nodeid="${node.id}"]`, // Cambiado de "default" a "output"
          );
          break;
        }
        case 'decision': {
          requiredHandles.push(`[data-handleid="input"][data-nodeid="${node.id}"]`);
          break;
        }
        case 'end': {
          requiredHandles.push(`[data-handleid="input"][data-nodeid="${node.id}"]`);
          break;
        }
      }
    }

    // Verificar que todos los handles existan en el DOM
    const foundHandles = requiredHandles.filter((selector) => {
      const element = document.querySelector(selector);
      return element !== null;
    });

    const allHandlesFound = foundHandles.length === requiredHandles.length;
    return allHandlesFound;
  }, []);

  // Efecto principal para verificar handles y forzar actualización
  useEffect(() => {
    // OPTIMIZED: Get nodes from store only when needed
    const { nodes } = useFlowStore.getState();
    if (!isLoaded || nodes.length === 0 || handlesReady || checkAttempts.current >= maxAttempts) {
      return;
    }

    const attempt = checkAttempts.current;
    const delay = 100 + attempt * 100; // 100ms, 200ms, 300ms, 400ms, 500ms

    const timeoutId = setTimeout(() => {
      checkAttempts.current++;

      if (checkHandlesInDOM()) {
        // Todos los handles están listos, forzar actualización final
        const currentNodes = useFlowStore.getState().nodes;
        const criticalNodes = currentNodes.filter((node) =>
          ['start', 'message', 'decision', 'end'].includes(node.type),
        );

        for (const node of criticalNodes) {
          updateNodeInternals(node.id);
        }

        setHandlesReady(true);
      } else {
        // Handles not ready yet, will retry
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [isLoaded, updateNodeInternals, handlesReady, checkHandlesInDOM]);

  // Reset cuando se recarga el flujo
  useEffect(() => {
    if (!isLoaded) {
      checkAttempts.current = 0;
      setHandlesReady(false);
    }
  }, [isLoaded]);

  return { handlesReady };
};

export default useEdgeTimingFix;

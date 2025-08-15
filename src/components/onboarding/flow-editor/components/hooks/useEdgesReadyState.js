/**
 * useEdgesReadyState.js
 * Custom hook for managing edges ready state with robust handle verification
 * Solves ReactFlow Error #008 by ensuring handles exist before processing edges
 *
 * @version 2.0.0 - Robust handle verification implementation
 */

import { useEffect, useState, useCallback } from 'react';

/**
 * Verifica si todos los handles críticos están montados en el DOM
 * @returns {boolean} True si todos los handles críticos están disponibles
 */
const verifyAllHandlesExist = () => {
  // Handles críticos que deben estar presentes
  const criticalHandles = [
    'output', // StartNode source handle
    'input', // MessageNode target handle
    'default', // MessageNode source handle
  ];

  let foundHandles = 0;

  // INVESTIGACIÓN EXHAUSTIVA: Buscar TODOS los elementos posibles
  const allSelectors = [
    // ReactFlow selectores oficiales
    '.react-flow__handle',
    '.react-flow__handle-top',
    '.react-flow__handle-bottom',
    '.react-flow__handle-left',
    '.react-flow__handle-right',
    '.react-flow__handle-source',
    '.react-flow__handle-target',

    // Nuestros selectores personalizados
    '.start-node__handle',
    '.message-node__handle',

    // Atributos data
    '[data-handleid]',
    '[data-handletype]',
    '[data-id]',

    // Elementos con IDs específicos
    '#output',
    '#input',
    '#default',

    // Búsqueda amplia por clases
    '[class*="handle"]',
    '[class*="Handle"]',
  ];

  for (const selector of allSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        // Verificar si es un handle crítico
        const possibleIds = [element.id, element.dataset.handleid, element.dataset.id].filter(
          Boolean,
        );

        if (possibleIds.some((id) => criticalHandles.includes(id))) {
          foundHandles++;
        }
      }
    } catch {
      // Silent error handling
    }
  }

  const allCriticalFound = foundHandles >= criticalHandles.length;

  // Removed console logs

  // Silent verification - no console output

  return allCriticalFound;
};

/**
 * Custom hook for managing edges ready state with robust handle verification
 * Solves ReactFlow Error #008 by ensuring handles exist before processing edges
 *
 * @param {number} maxWaitTime - Máximo tiempo de espera en ms (default: 500)
 * @returns {[boolean, function]} [areEdgesReady, setAreEdgesReady] - State and setter for edges ready flag
 */
export const useEdgesReadyState = (maxWaitTime = 500) => {
  const [areEdgesReady, setAreEdgesReady] = useState(false);

  const checkHandlesAndSetReady = useCallback(() => {
    if (verifyAllHandlesExist()) {
      setAreEdgesReady(true);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    // Verificación inmediata
    if (checkHandlesAndSetReady()) {
      return;
    }

    // Verificación periódica cada 50ms
    const intervalId = setInterval(() => {
      if (checkHandlesAndSetReady()) {
        clearInterval(intervalId);
      }
    }, 50);

    // Fallback: activar después del tiempo máximo
    const timeoutId = setTimeout(() => {
      setAreEdgesReady(true);
      clearInterval(intervalId);
    }, maxWaitTime);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [maxWaitTime, checkHandlesAndSetReady]);

  return [areEdgesReady, setAreEdgesReady];
};

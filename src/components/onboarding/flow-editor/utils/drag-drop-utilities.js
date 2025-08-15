/**
 * @file drag-drop-utilities.js
 * @description Utilidades para operaciones de drag and drop en el editor de flujo
 * Extraído de useDragAndDropManager.js para reducir max-lines-per-function
 */

import { applyNodeVisibilityFix } from './optimized-flow-fixes';

/**
 * Aplica correcciones de visibilidad a los nodos después del drop
 * Asegura que todos los nodos sean visibles y tengan la opacidad correcta
 */
export function applyPostDropVisibilityFix() {
  setTimeout(() => {
    try {
      if (typeof applyNodeVisibilityFix === 'function') {
        applyNodeVisibilityFix();
      }
      for (const nodeElement of document.querySelectorAll('.react-flow__node')) {
        nodeElement.style.opacity = '1';
        nodeElement.style.visibility = 'visible';
        nodeElement.style.display = 'block';
      }
    } catch {
      // Silently fail
    }
  }, 100);
}

/**
 * Crea un nodo simple con configuración estándar
 * @param {Object} nodeInfo - Información del nodo
 * @param {Object} position - Posición del nodo
 * @returns {Object} Nuevo nodo configurado
 */
export function createSimpleNode(nodeInfo, position) {
  return {
    id: nodeInfo.id,
    type: nodeInfo.type,
    position,
    data: {
      ...nodeInfo.data,
      id: nodeInfo.id,
    },
    draggable: true,
    selectable: true,
    connectable: true,
    style: { opacity: 1, visibility: 'visible', ...nodeInfo.style },
    hidden: false,
  };
}

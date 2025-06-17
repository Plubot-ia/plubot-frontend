/**
 * fix-node-positions.js
 * Solución para corregir el posicionamiento forzado de nodos en el editor de flujos
 */

const STACK_OFFSET = 20; // Píxeles para desplazar nodos apilados

export const preventNodeStacking = (nodes) => {
  // Eliminado console.log para mejorar rendimiento
  // console.log('[Cascade] preventNodeStacking CALLED. Nodes count:', nodes ? nodes.length : 0);
  if (!nodes || nodes.length === 0) {
    return [];
  }

  const newNodes = [];
  const positionCounts = new Map(); // Para rastrear cuántos nodos hay en cada posición {x,y}

  nodes.forEach(node => {
    if (!node.position) {
      // Si un nodo no tiene posición, lo añadimos tal cual o con una posición por defecto.
      // Por ahora, lo añadimos tal cual. Considerar asignar { x: 0, y: 0 } si es necesario.
      newNodes.push(node);
      return;
    }

    let { x, y } = node.position;
    const posKey = `${x},${y}`;

    let currentCount = positionCounts.get(posKey) || 0;

    if (currentCount > 0) {
      // Ya existe al menos un nodo en esta posición. Aplicar offset diagonal.
      x += STACK_OFFSET * currentCount;
      y += STACK_OFFSET * currentCount;
    }

    // Actualizar el contador para la posición original (o la nueva si se movió)
    positionCounts.set(posKey, currentCount + 1);

    newNodes.push({
      ...node,
      position: { x, y },
    });
  });

  return newNodes;
};

/**
 * Corrige la posición de los nodos que están siendo forzados a una posición específica
 * @param {Function|Array} nodesInput - Función para obtener los nodos actuales o array de nodos
 * @param {Function} [setNodes] - Función para establecer los nodos actualizados (opcional si nodesInput es un array)
 * @returns {Function} Función de limpieza o array de nodos actualizados
 */
export const fixNodePositions = (nodesInput, setNodes) => {
  if (typeof window === 'undefined') {
    console.log('[FixNodePositions] DESACTIVADO (window is undefined)');
    return () => {}; // Devuelve una función de limpieza no-op
  }

  // console.log('[FixNodePositions] Lógica estaba desactivada para prueba.');
  
  const isNodesArray = Array.isArray(nodesInput);
  
  if (isNodesArray) {
    // Si se pasó un array de nodos, devolverlo sin modificar.
    return nodesInput; 
  } else {
    // Si se pasó una función para obtener nodos y una función setNodes (uso con hooks/estado),
    // devolvemos una función de limpieza que no hace nada.
    return () => {
      // console.log('[FixNodePositions] Función de limpieza llamada.');
    };
  }
};

/**
 * Comprueba si un nodo está fuera del área visible y lo reposiciona
 * @param {Object} node - Nodo a verificar
 * @returns {Object} Nodo con posición corregida si estaba fuera de límites
 */
export const ensureNodeInBounds = (node) => {
  // Definir límites razonables para el área visible
  const minX = -2000;
  const maxX = 2000;
  const minY = -2000;
  const maxY = 2000;
  
  if (!node.position) {
    // Si el nodo no tiene posición, devolverlo sin cambios o asignar una por defecto.
    // Por consistencia con preventNodeStacking, lo devolvemos tal cual.
    return node;
  }
  
  let { x, y } = node.position;
  
  // Corregir posición si está fuera de límites, moviéndolo al borde dentro del área permitida.
  if (x < minX) x = minX;
  if (x > maxX) x = maxX;
  if (y < minY) y = minY;
  if (y > maxY) y = maxY;
  
  if (x !== node.position.x || y !== node.position.y) {
    return {
      ...node,
      position: { x, y }
    };
  }
  
  return node; // Devolver nodo sin cambios si está dentro de límites
};

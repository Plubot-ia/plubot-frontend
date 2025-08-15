/**
 * fix-node-positions.js
 * Solución para corregir el posicionamiento forzado de nodos en el editor de flujos
 */

const STACK_OFFSET = 20; // Píxeles para desplazar nodos apilados

export const preventNodeStacking = (nodes) => {
  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return [];
  }

  const occupiedPositions = new Set();
  const newNodes = [];

  for (const node of nodes) {
    if (!node.position) {
      newNodes.push(node);
      continue;
    }

    let { x, y } = node.position;
    let posKey = `${x},${y}`;

    // Si la posición ya está ocupada, buscar una nueva.
    while (occupiedPositions.has(posKey)) {
      x += STACK_OFFSET;
      y += STACK_OFFSET;
      posKey = `${x},${y}`;
    }

    // Registrar la posición final como ocupada.
    occupiedPositions.add(posKey);

    // Añadir el nodo con su posición final garantizada.
    newNodes.push({
      ...node,
      position: { x, y },
    });
  }

  return newNodes;
};

/**
 * Corrige la posición de los nodos que están siendo forzados a una posición específica
 * @param {Function|Array} nodesInput - Función para obtener los nodos actuales o array de nodos
 * @param {Function} [setNodes] - Función para establecer los nodos actualizados (opcional si nodesInput es un array)
 * @returns {Function} Función de limpieza o array de nodos actualizados
 */
export const fixNodePositions = (nodesInput, _setNodes) => {
  // En SSR, siempre devolver una función de limpieza no-op.
  if (globalThis.window === undefined) {
    return () => {
      /* no-op */
    };
  }

  // Si es un array, se devuelve directamente; de lo contrario, se devuelve una función no-op.
  return Array.isArray(nodesInput)
    ? nodesInput
    : () => {
        /* no-op */
      };
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
      position: { x, y },
    };
  }

  return node; // Devolver nodo sin cambios si está dentro de límites
};

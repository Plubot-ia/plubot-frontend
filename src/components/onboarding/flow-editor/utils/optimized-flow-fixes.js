/**
 * optimized-flow-fixes.js
 *
 * Utilidad para forzar la visibilidad de los nodos en el editor.
 * Asegura que los nodos recién añadidos sean visibles y arrastrables.
 */

/**
 * Fuerza la visibilidad de los nodos en el editor.
 * Aplica estilos críticos a cada nodo para asegurar que sean visibles,
 * interactivos y estén correctamente posicionados en el viewport.
 */
export const applyNodeVisibilityFix = () => {
  const nodes = document.querySelectorAll('.react-flow__node');
  if (!nodes || nodes.length === 0) return;

  // Aplicar estilos críticos a cada nodo sin sobrecarga
  for (const node of nodes) {
    // Estilos mínimos necesarios para visibilidad
    node.style.visibility = 'visible';
    node.style.display = 'block';
    node.style.opacity = '1';

    // Garantizar que sean interactivos
    node.style.pointerEvents = 'all';
  }

  // Corregir el viewport si es necesario
  const viewport = document.querySelector('.react-flow__viewport');
  if (viewport && !viewport.style.transform) {
    viewport.style.transform = 'translate(0px, 0px) scale(1)';
  }
};

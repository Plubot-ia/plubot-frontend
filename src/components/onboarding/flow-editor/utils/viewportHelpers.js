/**
 * Viewport Helper Functions
 * Utilities for calculating viewport bounds and transformations
 */

/**
 * Calculate the bounding box of all nodes
 * @param {Array} nodes - Array of nodes with position and dimensions
 * @returns {Object} Bounds object with minX, minY, maxX, maxY
 */
export const calculateNodeBounds = (nodes) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const { x, y } = node.position;
    const width = node.width || node.measured?.width || 150;
    const height = node.height || node.measured?.height || 50;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  return { minX, minY, maxX, maxY };
};

/**
 * Calculate viewport transformation to fit all nodes
 * @param {Object} bounds - Node bounds from calculateNodeBounds
 * @param {DOMRect} containerRect - Container dimensions
 * @param {Object} options - Options including padding
 * @param {Object} zoomLimits - Min and max zoom limits
 * @returns {Object} Viewport object with x, y, zoom
 */
export const calculateViewport = (bounds, containerRect, options, zoomLimits) => {
  const { minX, minY, maxX, maxY } = bounds;
  const width = maxX - minX;
  const height = maxY - minY;
  const padding = options.padding ?? 0.1;

  // Calculate zoom to fit all nodes
  const scaleX = containerRect.width / (width * (1 + padding * 2));
  const scaleY = containerRect.height / (height * (1 + padding * 2));
  let zoom = Math.min(scaleX, scaleY);

  // Apply min/max zoom constraints
  zoom = Math.min(Math.max(zoom, zoomLimits.min), zoomLimits.max);

  // Calculate center position
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;
  const x = containerRect.width / 2 - centerX * zoom;
  const y = containerRect.height / 2 - centerY * zoom;

  return { x, y, zoom };
};

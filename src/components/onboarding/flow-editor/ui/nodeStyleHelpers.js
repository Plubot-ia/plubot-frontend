/**
 * Helpers para lógica de estilos condicionales en UltraOptimizedNode
 * Extraído para reducir complejidad ciclomática del componente principal
 *
 * @author Cascade AI
 * @version 1.0.0
 */

/**
 * Genera estilos base del nodo principal
 *
 * @param {boolean} isUltraMode - Si está en modo ultra
 * @param {number} xPos - Posición X
 * @param {number} yPos - Posición Y
 * @param {number} nodeZIndex - Z-index del nodo
 * @returns {Object} Objeto de estilos CSS
 */
export const getNodeMainStyles = (isUltraMode, xPos, yPos, nodeZIndex) => ({
  transform: isUltraMode ? `translate(${xPos}px, ${yPos}px)` : undefined,
  position: isUltraMode ? 'absolute' : undefined,
  zIndex: nodeZIndex,
  transition: isUltraMode ? 'none' : undefined,
  willChange: isUltraMode ? 'transform' : undefined,
  pointerEvents: 'all',
  userSelect: 'none',
  outlineColor: 'transparent',
  outlineWidth: 0,
  outline: 'none',
});

/**
 * Genera estilos para los handles (target/source)
 *
 * @param {boolean} isUltraMode - Si está en modo ultra
 * @returns {Object} Objeto de estilos CSS
 */
export const getHandleStyles = (isUltraMode) => ({
  opacity: isUltraMode ? 0.5 : 1,
  transition: isUltraMode ? 'none' : undefined,
  pointerEvents: 'all',
});

/**
 * Genera className seguro para tipo de nodo
 *
 * @param {string} type - Tipo del nodo
 * @returns {string} Clase CSS sanitizada
 */
export const getSafeNodeTypeClassName = (type) => {
  if (type && typeof type === 'string') {
    return type.toLowerCase().replaceAll(/[_\s]+/g, '-');
  }
  return 'default';
};

/**
 * Genera className completo para handle target
 *
 * @param {string} type - Tipo del nodo
 * @returns {string} ClassName completo
 */
export const getTargetHandleClassName = (type) => {
  const safeType = getSafeNodeTypeClassName(type);
  return `node-handle target-handle ${safeType}-target-handle`;
};

/**
 * Genera className completo para handle source
 *
 * @param {string} type - Tipo del nodo
 * @param {boolean} selected - Si está seleccionado
 * @returns {string} ClassName completo
 */
export const getSourceHandleClassName = (type, selected) => {
  const safeType = getSafeNodeTypeClassName(type);
  const selectedClass = selected ? 'selected' : '';
  return `node-handle source-handle ${safeType}-source-handle ${selectedClass}`.trim();
};

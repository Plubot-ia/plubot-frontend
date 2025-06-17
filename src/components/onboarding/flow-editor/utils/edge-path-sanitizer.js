/**
 * edge-path-sanitizer.js
 * Utilidad para sanitizar los paths SVG de las aristas en ReactFlow
 * y evitar errores de tipo "Problem parsing d=..."
 */

/**
 * Corrige los valores no válidos (NaN, Infinity) en las coordenadas de las aristas
 * @param {Object} coords - Coordenadas con posibles valores no válidos
 * @returns {Object} - Coordenadas sanitizadas
 */
export const sanitizeCoordinates = (coords) => {
  // Si las coordenadas son undefined o null, devolver un objeto vacío
  if (!coords) return { x: 0, y: 0 };
  
  // Crear un nuevo objeto para evitar modificar el original
  const sanitized = { ...coords };
  
  // Sanitizar la coordenada x
  if (isNaN(sanitized.x) || !isFinite(sanitized.x)) {
    sanitized.x = 0;
  }
  
  // Sanitizar la coordenada y
  if (isNaN(sanitized.y) || !isFinite(sanitized.y)) {
    sanitized.y = 0;
  }
  
  return sanitized;
};

/**
 * Parcha globalmente el método bezierEdge de ReactFlow para evitar errores NaN
 * Esta función debe llamarse al inicio de la aplicación
 */
export const patchReactFlowEdgePaths = () => {
  try {
    // Solo ejecutar en entorno de navegador
    if (typeof window === 'undefined') return;
    
    // Verificar si ya aplicamos el parche
    if (window.__reactFlowEdgePathsPatched) return;
    
    // Sobrescribir la función getBezierPath para sanitizar las coordenadas
    const originalGetBezierPath = window.getBezierPath;
    if (typeof originalGetBezierPath === 'function') {
      window.getBezierPath = function patchedGetBezierPath(
        sourceX, sourceY, sourcePosition, 
        targetX, targetY, targetPosition, centerX, centerY
      ) {
        // Sanitizar todas las coordenadas numéricas antes de pasarlas a la función original
        const safeSourceX = isNaN(sourceX) ? 0 : sourceX;
        const safeSourceY = isNaN(sourceY) ? 0 : sourceY;
        const safeTargetX = isNaN(targetX) ? 0 : targetX;
        const safeTargetY = isNaN(targetY) ? 0 : targetY;
        const safeCenterX = isNaN(centerX) ? 0 : centerX;
        const safeCenterY = isNaN(centerY) ? 0 : centerY;
        
        return originalGetBezierPath(
          safeSourceX, safeSourceY, sourcePosition,
          safeTargetX, safeTargetY, targetPosition,
          safeCenterX, safeCenterY
        );
      };
    }
    
    // Marcar como parcheado para evitar aplicar múltiples veces
    window.__reactFlowEdgePathsPatched = true;
    console.log('[edge-path-sanitizer] Paths SVG de aristas parcheados con éxito');
  } catch (error) {
    console.error('[edge-path-sanitizer] Error al parchear paths SVG de aristas:', error);
  }
};

/**
 * Sanitiza el path SVG de una arista para evitar valores NaN
 * @param {string} path - Path SVG original
 * @returns {string} - Path SVG sanitizado
 */
export const sanitizeSvgPath = (path) => {
  if (!path) return '';
  
  // Reemplazar valores NaN por 0
  return path.replace(/NaN/g, '0');
};

/**
 * Hook para corregir los paths de aristas en ReactFlow
 * Se puede usar en cualquier componente que renderice aristas
 */
export const useEdgePathSanitizer = () => {
  // Aplicar el parche global solo una vez
  patchReactFlowEdgePaths();
  
  return {
    sanitizeCoordinates,
    sanitizeSvgPath
  };
};

export default useEdgePathSanitizer;

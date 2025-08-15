/**
 * nodeDimensions.js
 * Proporciona dimensiones estimadas para cada tipo de nodo.
 * Estas dimensiones se utilizan en el sistema de virtualización para calcular
 * la visibilidad de los nodos ANTES de su primer renderizado, eliminando
 * el cuello de botella de la carga inicial.
 *
 * Las dimensiones no necesitan ser perfectas al píxel, pero deben ser una
 * aproximación razonable del tamaño del nodo en su estado "Full" (LOD 0).
 */
export const nodeEstimatedDimensions = {
  // Nodos básicos de flujo
  start: { width: 180, height: 80 },
  end: { width: 180, height: 80 },

  // Nodos de contenido y lógica
  message: { width: 320, height: 200 },
  decision: { width: 300, height: 250 },
  action: { width: 300, height: 180 },
  option: { width: 280, height: 120 },

  // Nodos de integración y avanzados
  httpRequest: { width: 350, height: 300 },
  power: { width: 350, height: 450 },
  discord: { width: 320, height: 280 },
  ai: { width: 350, height: 350 },
  emotionDetection: { width: 300, height: 220 },

  // Fallback para tipos de nodo no especificados
  default: { width: 250, height: 150 },
};

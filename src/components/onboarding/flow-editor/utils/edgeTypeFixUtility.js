/**
 * Utilidad para solucionar el problema con el campo edge_type en las aristas
 *
 * El backend muestra el error: 'FlowEdge' object has no attribute 'edge_type'
 * Esta utilidad elimina el campo edge_type de las aristas antes de enviarlas al backend
 * y asegura que el campo type esté presente
 */

/**
 * Prepara las aristas para el backend eliminando el campo edge_type que causa error
 * @param {Array} edges - Aristas a preparar
 * @returns {Array} - Aristas preparadas sin el campo edge_type
 */
export const prepareEdgesForBackend = (edges) => {
  if (!edges || !Array.isArray(edges)) return [];

  return edges.map((edge) => {
    // Crear una copia sin el campo edge_type
    const { edge_type: _edge_type, ...edgeWithoutEdgeType } = edge;

    // Asegurarse de que type esté presente (el backend usará este campo)
    return {
      ...edgeWithoutEdgeType,
      type: edge.type || 'default',
      // Asegurarse de que source y target sean strings
      source: String(edge.source),
      target: String(edge.target),
      // Mantener los IDs originales para futuras operaciones
      sourceOriginal: edge.sourceOriginal || edge.source,
      targetOriginal: edge.targetOriginal || edge.target,
    };
  });
};

/**
 * Verifica si las aristas son válidas (tienen source y target)
 * @param {Array} edges - Aristas a verificar
 * @param {Object} nodeMap - Mapa de nodos para verificar que existen
 * @returns {Array} - Aristas válidas
 */
export const validateEdges = (edges, nodeMap = {}) => {
  if (!edges || !Array.isArray(edges)) return [];

  return edges.filter((edge) => {
    // Verificar que source y target existen
    const source = String(edge.source);
    const target = String(edge.target);

    // eslint-disable-next-line security/detect-object-injection
    const sourceExists = nodeMap[source];
    // eslint-disable-next-line security/detect-object-injection
    const targetExists = nodeMap[target];

    return sourceExists && targetExists;
  });
};

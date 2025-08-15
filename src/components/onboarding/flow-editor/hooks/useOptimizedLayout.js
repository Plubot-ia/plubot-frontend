import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para optimizar el cálculo de layout y conexiones
 * Solo recalcula cuando cambian posiciones o conexiones relevantes
 *
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de conexiones
 * @returns {Object} - Métodos y estado optimizados para el layout
 */
const useOptimizedLayout = (nodes, edges) => {
  // Cache para posiciones de nodos y puntos de conexión
  const nodePositionsCache = useRef(new Map());
  const connectionPointsCache = useRef(new Map());

  // Estado para indicar si el layout necesita recalcularse
  const [needsRecalculation, setNeedsRecalculation] = useState(true);

  /**
   * Actualiza el cache de posiciones de nodos
   */
  useEffect(() => {
    const hasPositionChanged = nodes.some((node) => {
      const cachedPosition = nodePositionsCache.current.get(node.id);
      if (!cachedPosition) return true;

      return cachedPosition.x !== node.position.x || cachedPosition.y !== node.position.y;
    });

    // Si alguna posición ha cambiado, actualizar el cache y marcar para recalcular
    if (hasPositionChanged) {
      for (const node of nodes) {
        nodePositionsCache.current.set(node.id, { ...node.position });
      }
      setNeedsRecalculation(true);
    }
  }, [nodes]);

  /**
   * Actualiza el cache de puntos de conexión
   */
  useEffect(() => {
    const hasConnectionChanged = edges.some((edge) => {
      const cacheKey = `${edge.source}-${edge.target}`;
      const cachedConnection = connectionPointsCache.current.get(cacheKey);
      if (!cachedConnection) return true;

      // Comparar propiedades relevantes de la conexión
      return (
        cachedConnection.sourceHandle !== edge.sourceHandle ||
        cachedConnection.targetHandle !== edge.targetHandle
      );
    });

    // Si alguna conexión ha cambiado, actualizar el cache y marcar para recalcular
    if (hasConnectionChanged) {
      for (const edge of edges) {
        const cacheKey = `${edge.source}-${edge.target}`;
        connectionPointsCache.current.set(cacheKey, {
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        });
      }
      setNeedsRecalculation(true);
    }
  }, [edges]);

  /**
   * Calcula los puntos de control para una conexión Bezier
   * Solo se ejecuta cuando es necesario recalcular
   */
  const calculateBezierPoints = useCallback(
    (edge) => {
      // Si no necesita recalcularse, devolver del cache si existe
      if (!needsRecalculation) {
        const cacheKey = `bezier-${edge.source}-${edge.target}`;
        const cachedPoints = connectionPointsCache.current.get(cacheKey);
        if (cachedPoints) return cachedPoints;
      }

      // Obtener nodos source y target
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) return;

      // Calcular puntos de control (simplificado)
      const sourceX = sourceNode.position.x + (sourceNode.width || 150) / 2;
      const sourceY = sourceNode.position.y + (sourceNode.height || 100) / 2;
      const targetX = targetNode.position.x + (targetNode.width || 150) / 2;
      const targetY = targetNode.position.y + (targetNode.height || 100) / 2;

      // Calcular punto de control para la curva
      const controlX = (sourceX + targetX) / 2;
      const controlY = (sourceY + targetY) / 2;

      // Guardar en cache
      const points = { sourceX, sourceY, targetX, targetY, controlX, controlY };
      const cacheKey = `bezier-${edge.source}-${edge.target}`;
      connectionPointsCache.current.set(cacheKey, points);

      return points;
    },
    [nodes, needsRecalculation],
  );

  /**
   * Marca que el layout ya ha sido recalculado
   */
  const finishRecalculation = useCallback(() => {
    setNeedsRecalculation(false);
  }, []);

  return {
    needsRecalculation,
    calculateBezierPoints,
    finishRecalculation,
  };
};

export default useOptimizedLayout;

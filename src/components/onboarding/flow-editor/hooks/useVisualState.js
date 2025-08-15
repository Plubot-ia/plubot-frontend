/**
 * useVisualState.js
 * Hook personalizado para separar el estado visual del estado lógico en el editor de flujos
 * Esto mejora el rendimiento al evitar re-renders innecesarios cuando solo cambian aspectos visuales
 */

import { useState, useCallback, useRef } from 'react';

// Helper: Aplicar estilos visuales a un nodo
function _applyNodeVisualStyles(node, options) {
  const { visualStyle, animationState, visualPosition } = options;
  if (!node) return node;

  // Crear una copia del nodo para no modificar el original
  const styledNode = { ...node };

  // Aplicar posición visual si existe
  if (visualPosition) {
    styledNode.position = visualPosition;
  }

  // Aplicar estilos visuales
  if (visualStyle) {
    styledNode.style = {
      ...styledNode.style,
      // Aplicar estilos según el estado visual
      ...(visualStyle.hover ? { boxShadow: '0 0 10px rgba(255, 0, 255, 0.7)' } : {}),
      ...(visualStyle.selected ? { borderColor: '#ff00ff', borderWidth: 2 } : {}),
    };
  }

  // Aplicar estados de animación
  if (animationState && Object.keys(animationState).length > 0) {
    styledNode.animated = Object.values(animationState).some(Boolean);
  }

  return styledNode;
}

// Helper: Aplicar estilos visuales a una arista
function _applyEdgeVisualStyles(edge, visualStyle, animationState) {
  if (!edge) return edge;

  // Crear una copia de la arista para no modificar la original
  const styledEdge = { ...edge };

  // Aplicar estilos visuales
  if (visualStyle) {
    styledEdge.style = {
      ...styledEdge.style,
      // Aplicar estilos según el estado visual
      ...(visualStyle.hover ? { strokeWidth: 3 } : {}),
      ...(visualStyle.selected ? { stroke: '#ff00ff' } : {}),
    };
  }

  // Aplicar estados de animación
  if (animationState && Object.keys(animationState).length > 0) {
    styledEdge.animated = Object.values(animationState).some(Boolean);
  }

  return styledEdge;
}

/**
 * Hook para gestionar el estado visual de los nodos y aristas
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Métodos y estado para gestionar el estado visual
 */
const useVisualState = (_options = {}) => {
  // Estado para posiciones visuales (no afecta al estado lógico)
  const [visualPositions, setVisualPositions] = useState({});

  // Referencia para almacenar estilos visuales temporales (hover, selección, etc.)
  const visualStylesReference = useRef(new Map());

  // Referencia para almacenar el estado de animación
  const animationStateReference = useRef(new Map());

  /**
   * Actualiza la posición visual de un nodo sin afectar su estado lógico
   * @param {string} nodeId - ID del nodo
   * @param {Object} position - Nueva posición {x, y}
   */
  const updateVisualPosition = useCallback((nodeId, position) => {
    setVisualPositions((previous) => ({
      ...previous,
      [nodeId]: position,
    }));
  }, []);

  /**
   * Actualiza el estilo visual de un nodo o arista
   * @param {string} elementId - ID del elemento (nodo o arista)
   * @param {string} styleType - Tipo de estilo (hover, selected, etc.)
   * @param {boolean} value - Valor del estilo
   */
  const updateVisualStyle = useCallback((elementId, styleType, value) => {
    const currentStyles = visualStylesReference.current.get(elementId) ?? {};
    visualStylesReference.current.set(elementId, {
      ...currentStyles,
      [styleType]: value,
    });
  }, []);

  /**
   * Obtiene el estilo visual actual de un elemento
   * @param {string} elementId - ID del elemento
   * @returns {Object} - Estilos visuales del elemento
   */
  const getVisualStyle = useCallback((elementId) => {
    return visualStylesReference.current.get(elementId) ?? {};
  }, []);

  /**
   * Actualiza el estado de animación de un elemento
   * @param {string} elementId - ID del elemento
   * @param {string} animationType - Tipo de animación
   * @param {boolean} isActive - Si la animación está activa
   */
  const updateAnimationState = useCallback((elementId, animationType, isActive) => {
    const currentState = animationStateReference.current.get(elementId) ?? {};
    animationStateReference.current.set(elementId, {
      ...currentState,
      [animationType]: isActive,
    });
  }, []);

  /**
   * Obtiene el estado de animación de un elemento
   * @param {string} elementId - ID del elemento
   * @returns {Object} - Estado de animación del elemento
   */
  const getAnimationState = useCallback((elementId) => {
    return animationStateReference.current.get(elementId) ?? {};
  }, []);

  /**
   * Aplica estilos visuales a un nodo basado en su estado visual
   * @param {Object} node - Nodo a procesar
   * @returns {Object} - Nodo con estilos visuales aplicados
   */
  const applyVisualStyles = useCallback(
    (node) => {
      const visualStyle = getVisualStyle(node.id);
      const animationState = getAnimationState(node.id);
      const visualPosition = visualPositions[node.id];
      return _applyNodeVisualStyles(node, {
        visualStyle,
        animationState,
        visualPosition,
      });
    },
    [visualPositions, getVisualStyle, getAnimationState],
  );

  /**
   * Aplica estilos visuales a una arista basado en su estado visual
   * @param {Object} edge - Arista a procesar
   * @returns {Object} - Arista con estilos visuales aplicados
   */
  const applyEdgeVisualStyles = useCallback(
    (edge) => {
      const visualStyle = getVisualStyle(edge.id);
      const animationState = getAnimationState(edge.id);
      return _applyEdgeVisualStyles(edge, visualStyle, animationState);
    },
    [getVisualStyle, getAnimationState],
  );

  /**
   * Procesa todos los nodos para aplicar estilos visuales
   * @param {Array} nodes - Nodos a procesar
   * @returns {Array} - Nodos con estilos visuales aplicados
   */
  const processNodesWithVisualStyles = useCallback(
    (nodes) => {
      if (!Array.isArray(nodes)) return nodes;
      return nodes.map((node) => applyVisualStyles(node));
    },
    [applyVisualStyles],
  );

  /**
   * Procesa todas las aristas para aplicar estilos visuales
   * @param {Array} edges - Aristas a procesar
   * @returns {Array} - Aristas con estilos visuales aplicados
   */
  const processEdgesWithVisualStyles = useCallback(
    (edges) => {
      if (!Array.isArray(edges)) return edges;
      return edges.map((edge) => applyEdgeVisualStyles(edge));
    },
    [applyEdgeVisualStyles],
  );

  // Exportar métodos y estado
  return {
    // Métodos para actualizar el estado visual
    updateVisualPosition,
    updateVisualStyle,
    updateAnimationState,

    // Métodos para obtener el estado visual
    getVisualStyle,
    getAnimationState,

    // Métodos para procesar elementos con estilos visuales
    applyVisualStyles,
    applyEdgeVisualStyles,
    processNodesWithVisualStyles,
    processEdgesWithVisualStyles,
  };
};

export default useVisualState;

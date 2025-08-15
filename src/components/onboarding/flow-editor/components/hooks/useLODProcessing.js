/**
 * useLODProcessing.js
 * Custom hook for Level of Detail (LOD) processing of nodes and edges
 * Extracted from FlowMain for better code organization and separation of concerns
 *
 * @version 1.0.0
 */

import { useMemo } from 'react';

import { addEdgePresentationProps } from '../flowEdgeHelpers';

// Helper functions for edge validation (moved from FlowMain)
const isHandleInvalid = (handle) => {
  return handle === undefined || handle === 'undefined' || handle === null || handle === '';
  // NOTA: 'output' y 'default' son handles VÁLIDOS y no deben ser eliminados
};

const isValidEdgeForRender = (edge) => {
  return edge && edge.source && edge.target;
};

const sanitizeEdgeHandles = (edge) => {
  const sanitizedEdge = { ...edge };

  if (isHandleInvalid(edge.sourceHandle)) {
    delete sanitizedEdge.sourceHandle;
  }

  if (isHandleInvalid(edge.targetHandle)) {
    delete sanitizedEdge.targetHandle;
  }

  return sanitizedEdge;
};

/**
 * Custom hook for processing nodes and edges with Level of Detail (LOD) optimizations
 * @param {Array} visibleNodes - Currently visible nodes
 * @param {Array} visibleEdges - Currently visible edges
 * @param {number} lodLevel - Current LOD level (0-2)
 * @param {boolean} isUltraMode - Whether ultra mode is enabled
 * @param {string|null} draggingNodeId - ID of the node being dragged (null if none)
 * @returns {Object} Processed nodes and edges with LOD applied
 */
export const useLODProcessing = ({
  visibleNodes = [],
  visibleEdges = [],
  lodLevel = 0,
  isUltraMode = false,
  // REMOVED: draggingNodeId - This was causing full recalculation on every drag event
}) => {
  // DEBUG: Track lodLevel value received - DISABLED to prevent console spam
  // console.log('🔍 [useLODProcessing] RECEIVED lodLevel:', lodLevel, 'type:', typeof lodLevel);
  // CRÍTICO: Optimizado para evitar recreación de nodos cuando solo cambia el LOD
  // Esto previene el desmontaje/remontaje de componentes y la pérdida de conexiones
  const nodesWithLOD = useMemo(() => {
    return visibleNodes.map((node) => {
      // Para MessageNode y otros nodos que usan data.lodLevel
      // Solo crear un nuevo objeto si el LOD realmente cambió
      if (node.data?.lodLevel === lodLevel) {
        return node; // Mantener la misma referencia si el LOD no cambió
      }

      // Para StartNode que usa lodLevel como prop de primer nivel
      // Mantener compatibilidad con ambos patrones
      if (node.type === 'startNode') {
        return {
          ...node,
          lodLevel, // StartNode usa lodLevel como prop de primer nivel
          data: {
            ...node.data,
            // No incluir lodLevel en data para StartNode
          },
        };
      }

      // Para el resto de nodos (MessageNode, DecisionNode, etc.)
      // Solo actualizar el data si el LOD cambió
      return {
        ...node,
        data: {
          ...node.data,
          lodLevel, // Inject LOD level from centralized state
        },
      };
    });
  }, [visibleNodes, lodLevel]);

  // Inject LOD level and selective drag state into visible edges
  const edgesWithLOD = useMemo(() => {
    const processedEdges = visibleEdges
      .map((edge) => {
        // REAL-TIME SANITIZATION: Fix problematic handles before filtering
        const sanitizedEdge = sanitizeEdgeHandles(edge);
        // Add presentation props
        const edgeWithProps = addEdgePresentationProps(sanitizedEdge, lodLevel, isUltraMode);

        // CRITICAL: Do NOT add any drag-related props here
        // Drag state should be handled separately to avoid recalculating all edges
        return edgeWithProps;
      })
      .filter((edge) => isValidEdgeForRender(edge));

    return processedEdges;
  }, [visibleEdges, lodLevel, isUltraMode]); // REMOVED draggingNodeId to prevent recalculation

  return {
    nodesWithLOD,
    edgesWithLOD,
  };
};

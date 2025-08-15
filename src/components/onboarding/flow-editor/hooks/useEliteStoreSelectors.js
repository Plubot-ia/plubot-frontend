/**
 * Elite Store Selectors - Apple-Level Performance
 *
 * Arquitectura de selectores con precisión quirúrgica que elimina renders innecesarios.
 * Cada selector está optimizado para actualizar SOLO cuando su data específica cambia.
 *
 * @version 2.0.0 - Elite Edition
 */

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { shallow } from 'zustand/shallow';

import useFlowStore from '@/stores/use-flow-store';

/**
 * Selector granular para nodos con comparación profunda inteligente
 * Solo re-renderiza si los nodos relevantes cambian estructuralmente
 */
export const useEliteNodesSelector = () => {
  const previousNodesRef = useRef([]);

  return useFlowStore(
    (state) => state.nodes ?? [],
    (previousNodes, nextNodes) => {
      // Comparación rápida por longitud
      if (previousNodes.length !== nextNodes.length) {
        previousNodesRef.current = nextNodes;
        return false;
      }

      // Comparación inteligente: solo propiedades que afectan el render
      for (const [index, previous] of previousNodes.entries()) {
        // eslint-disable-next-line security/detect-object-injection
        const next = nextNodes[index];

        // Solo comparar propiedades críticas para render
        if (
          previous.id !== next.id ||
          previous.type !== next.type ||
          previous.position.x !== next.position.x ||
          previous.position.y !== next.position.y ||
          previous.selected !== next.selected ||
          previous.data?.label !== next.data?.label
        ) {
          previousNodesRef.current = nextNodes;
          return false;
        }
      }

      return true; // No hay cambios relevantes
    },
  );
};

/**
 * Selector ESTRUCTURAL para nodos - Ignora cambios de posición
 * Usado por componentes que NO necesitan actualizarse durante drag
 */
export const useStructuralNodesSelector = () => {
  return useFlowStore(
    (state) => state.nodes ?? [],
    (previousNodes, nextNodes) => {
      // Comparación rápida por longitud
      if (previousNodes.length !== nextNodes.length) return false;

      // Comparación SOLO de propiedades estructurales (NO posición)
      for (const [index, previous] of previousNodes.entries()) {
        // eslint-disable-next-line security/detect-object-injection
        const next = nextNodes[index];

        // Ignoramos position.x y position.y completamente
        if (
          previous.id !== next.id ||
          previous.type !== next.type ||
          previous.selected !== next.selected ||
          previous.data?.label !== next.data?.label ||
          previous.hidden !== next.hidden ||
          previous.deleted !== next.deleted
        ) {
          return false;
        }
      }

      return true; // No hay cambios estructurales
    },
  );
};

/**
 * Selector granular para edges con comparación optimizada
 * Solo re-renderiza si las conexiones cambian estructuralmente
 */
export const useEliteEdgesSelector = () => {
  return useFlowStore(
    (state) => state.edges ?? [],
    (previousEdges, nextEdges) => {
      // Comparación rápida por longitud
      if (previousEdges.length !== nextEdges.length) return false;

      // Comparación por propiedades críticas
      for (const [index, previous] of previousEdges.entries()) {
        // eslint-disable-next-line security/detect-object-injection
        const next = nextEdges[index];

        if (
          previous.id !== next.id ||
          previous.source !== next.source ||
          previous.target !== next.target ||
          previous.sourceHandle !== next.sourceHandle ||
          previous.targetHandle !== next.targetHandle ||
          previous.selected !== next.selected
        ) {
          return false;
        }
      }

      return true;
    },
  );
};

/**
 * Selector para posiciones de nodos - Solo para componentes que necesitan tracking de posición
 * Usado por CustomMiniMap para actualizaciones precisas
 */
export const useNodePositionsSelector = () => {
  const _positionsMapRef = useRef(new Map());

  return useFlowStore(
    (state) => {
      const positions = new Map();
      if (state.nodes)
        for (const node of state.nodes) {
          positions.set(node.id, {
            x: node.position.x,
            y: node.position.y,
            width: node.width || 150,
            height: node.height || 50,
          });
        }
      return positions;
    },
    (previousMap, nextMap) => {
      // Comparación eficiente de Maps
      if (previousMap.size !== nextMap.size) return false;

      for (const [id, previousPos] of previousMap) {
        const nextPos = nextMap.get(id);
        if (!nextPos) return false;

        // Tolerancia de 0.5px para evitar renders por cambios imperceptibles
        if (
          Math.abs(previousPos.x - nextPos.x) > 0.5 ||
          Math.abs(previousPos.y - nextPos.y) > 0.5 ||
          previousPos.width !== nextPos.width ||
          previousPos.height !== nextPos.height
        ) {
          return false;
        }
      }

      return true;
    },
  );
};

/**
 * Selector para un nodo específico - Máxima granularidad
 * Cada nodo solo se actualiza cuando SUS propiedades cambian
 */
export const useEliteSingleNodeSelector = (nodeId) => {
  return useFlowStore(
    (state) => state.nodes?.find((n) => n.id === nodeId),
    (previousNode, nextNode) => {
      if (!previousNode && !nextNode) return true;
      if (!previousNode || !nextNode) return false;

      return (
        previousNode.position.x === nextNode.position.x &&
        previousNode.position.y === nextNode.position.y &&
        previousNode.selected === nextNode.selected &&
        previousNode.data === nextNode.data // Comparación por referencia para data
      );
    },
  );
};

/**
 * Selector para edges de un nodo específico
 * Solo actualiza cuando las conexiones de ESE nodo cambian
 */
export const useNodeEdgesSelector = (nodeId) => {
  return useFlowStore(
    (state) => {
      return state.edges?.filter((edge) => edge.source === nodeId || edge.target === nodeId) ?? [];
    },
    shallow, // Comparación shallow para array de edges filtrados
  );
};

/**
 * Selector para metadata del flow (no cambia durante drag)
 * Usado por componentes que no necesitan actualizarse durante interacciones
 */
export const useFlowMetadataSelector = () => {
  return useFlowStore(
    (state) => ({
      plubotId: state.plubotId,
      flowName: state.flowName,
      isUltraMode: state.isUltraMode,
      lastSaved: state.lastSaved,
    }),
    shallow,
  );
};

/**
 * Selector para UI flags - Separado de datos del flow
 */
export const useUIFlagsSelector = () => {
  return useFlowStore(
    (state) => ({
      isNodeBeingDragged: state.isNodeBeingDragged,
      isConnecting: state.isConnecting,
      selectedNodeId: state.selectedNodeId,
      hoveredNodeId: state.hoveredNodeId,
    }),
    shallow,
  );
};

/**
 * Hook compuesto para FlowMain - Combina selectores necesarios
 * OPTIMIZADO: Usa selectores estructurales para evitar renders durante drag
 */
export const useEliteFlowMainSelectors = () => {
  // REVERT: Must use position-aware selector for React Flow to work
  const nodes = useEliteNodesSelector(); // INCLUYE posiciones - necesario para drag
  const edges = useEliteEdgesSelector();
  const metadata = useFlowMetadataSelector();
  const uiFlags = useUIFlagsSelector();

  return useMemo(
    () => ({
      nodes,
      edges,
      ...metadata,
      ...uiFlags,
    }),
    [nodes, edges, metadata, uiFlags],
  );
};

/**
 * Hook para componentes que SÍ necesitan posiciones (como edges durante drag)
 */
export const useEliteNodesWithPositions = () => {
  const nodes = useEliteNodesSelector(); // Este SÍ incluye posiciones
  const edges = useEliteEdgesSelector();
  const metadata = useFlowMetadataSelector();

  return useMemo(
    () => ({
      nodes,
      edges,
      ...metadata,
    }),
    [nodes, edges, metadata],
  );
};

/**
 * Hook para CustomMiniMap - OPTIMIZED: Uses polling instead of subscriptions
 * This prevents re-renders during node dragging
 */
export const useEliteMiniMapSelectors = () => {
  const [minimapData, setMinimapData] = useState(() => {
    const state = useFlowStore.getState();
    return {
      nodePositions: new Map(),
      edges: state.edges || [],
      selectedNodeId: state.selectedNodeId,
      isNodeBeingDragged: state.isDragging,
    };
  });

  const previousPositionsRef = useRef(new Map());
  const intervalRef = useRef(null);

  // Helper function to build node positions map
  const buildNodePositions = useCallback((nodes) => {
    // Helper function to check if node position changed (moved inside to avoid scoping issue)
    const hasNodePositionChanged = (previousData, nodeData) => {
      if (!previousData) return true;

      return (
        Math.abs(previousData.x - nodeData.x) > 5 || // Higher threshold for minimap
        Math.abs(previousData.y - nodeData.y) > 5 ||
        previousData.width !== nodeData.width ||
        previousData.height !== nodeData.height
      );
    };

    const nodePositions = new Map();
    let positionsChanged = false;

    for (const node of nodes) {
      const nodeData = {
        x: node.position?.x || 0,
        y: node.position?.y || 0,
        width: node.width || 150,
        height: node.height || 50,
      };

      nodePositions.set(node.id, nodeData);

      // Check if this node's position changed significantly
      const previousData = previousPositionsRef.current.get(node.id);
      if (hasNodePositionChanged(previousData, nodeData)) {
        positionsChanged = true;
      }
    }

    return { nodePositions, positionsChanged };
  }, []);

  useEffect(() => {
    // Poll for changes instead of subscribing
    const updateMinimapData = () => {
      const state = useFlowStore.getState();
      const nodes = state.nodes || [];
      const edges = state.edges || [];

      // Create a Map of node positions and sizes
      const { nodePositions, positionsChanged } = buildNodePositions(nodes);

      // Only update if positions actually changed
      if (positionsChanged || nodePositions.size !== previousPositionsRef.current.size) {
        previousPositionsRef.current = new Map(nodePositions);
        setMinimapData({
          nodePositions: new Map(nodePositions),
          edges,
          selectedNodeId: state.selectedNodeId,
          isNodeBeingDragged: state.isDragging,
        });
      }
    };

    // Initial update
    updateMinimapData();

    // Poll every 100ms (10 FPS is enough for minimap)
    intervalRef.current = setInterval(updateMinimapData, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [buildNodePositions]);

  return minimapData;
};

/**
 * Hook para EpicHeader - Solo metadata, no necesita nodes/edges
 */
export const useEliteHeaderSelectors = () => {
  const metadata = useFlowMetadataSelector();
  const { canUndo, canRedo } = useFlowStore(
    (state) => ({
      canUndo: state.canUndo(),
      canRedo: state.canRedo(),
    }),
    shallow,
  );

  return useMemo(
    () => ({
      ...metadata,
      canUndo,
      canRedo,
    }),
    [metadata, canUndo, canRedo],
  );
};

/**
 * Selector de acciones - No causa re-renders
 */
export const useEliteStoreActions = () => {
  return useFlowStore(
    (state) => ({
      setNodes: state.setNodes,
      setEdges: state.setEdges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      toggleUltraMode: state.toggleUltraMode,
      undo: state.undo,
      redo: state.redo,
      setReactFlowInstance: state.setReactFlowInstance,
    }),
    shallow,
  );
};

const useEliteStoreSelectors = {
  useEliteNodesSelector,
  useEliteEdgesSelector,
  useNodePositionsSelector,
  useEliteSingleNodeSelector,
  useNodeEdgesSelector,
  useFlowMetadataSelector,
  useUIFlagsSelector,
  useEliteFlowMainSelectors,
  useEliteMiniMapSelectors,
  useEliteHeaderSelectors,
  useEliteStoreActions,
};

export default useEliteStoreSelectors;

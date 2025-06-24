import { shallow } from 'zustand/shallow';

import useFlowStore from '@/stores/useFlowStore';
import useTrainingStore from '@/stores/useTrainingStore';

/**
 * Devuelve metadatos básicos del flujo (ID, nombre, estado de carga).
 */
export const useFlowMeta = () =>
  useFlowStore(
    (state) => ({
      plubotId: state.plubotId,
      flowName: state.flowName,
      isLoaded: state.isLoaded,
      setFlowName: state.setFlowName,
      setPlubotId: state.setPlubotId,
      resetFlow: state.resetFlow,
      isUltraMode: state.isUltraMode,
      toggleUltraMode: state.toggleUltraMode,
      getVisibleNodeCount: state.getVisibleNodeCount,
      lastSaved: state.lastSaved,
      saveFlow: state.saveFlow,
      fitView: state.fitView,
    }),
    shallow,
  );

/**
 * Devuelve nodos y aristas sin provocar re‐renders innecesarios.
 */
export const useFlowNodesEdges = () =>
  useFlowStore(
    (state) => ({
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      setNodes: state.setNodes,
      setEdges: state.setEdges,
      setSelectedNode: state.setSelectedNode,
      selectedNode: state.selectedNode, // Devuelve el ID del nodo seleccionado
      selectedEdge: state.selectedEdge,
      getVisibleEdgeCount: state.getVisibleEdgeCount,
      removeNode: state.removeNode,
      duplicateDecisionNode: state.duplicateDecisionNode,
      duplicateNode: state.duplicateNode,
      updateNode: state.updateNode,
      updateNodeData: state.updateNodeData,
      backupEdgesToLocalStorage: state.backupEdgesToLocalStorage,
    }),
    shallow,
  );

// Selector para obtener el objeto completo del nodo seleccionado
// Se recalculará solo cuando cambie el array de nodos o el ID del nodo seleccionado
export const useSelectedNode = () =>
  useFlowStore((state) =>
    state.nodes.find((n) => n.id === state.selectedNode),
  );

// Selector para obtener solo el objeto `data` de un nodo específico por ID
// Es muy eficiente porque solo se actualiza si las propiedades de `data` cambian (shallow compare)
export const useNodeData = (id) =>
  useFlowStore((state) => state.nodes.find((n) => n.id === id)?.data, shallow);

// Selector para obtener información del nodo padre de un nodo específico
// Devuelve el ID del padre y el color de su handle para consistencia visual
export const useParentNodeInfo = (id) =>
  useFlowStore(
    (state) => {
      const parentEdge = state.edges.find((e) => e.target === id);
      if (!parentEdge) return { sourceNode: null, parentHandleColor: null };

      const parentNode = state.nodes.find((n) => n.id === parentEdge.source);
      if (!parentNode) return { sourceNode: null, parentHandleColor: null };

      return {
        sourceNode: parentNode.id,
        parentHandleColor: parentNode.data?.style?.backgroundColor,
      };
    },
    shallow,
  );

/**
 * Exposición de funciones de undo/redo junto con flags canUndo/canRedo.
 */
/**
 * Hook para gestionar el estado y las acciones del menú contextual.
 */
export const useContextMenu = () =>
  useFlowStore(
    (state) => ({
      contextMenuVisible: state.contextMenuVisible,
      contextMenuPosition: state.contextMenuPosition,
      contextMenuNodeId: state.contextMenuNodeId,
      contextMenuItems: state.contextMenuItems,
      showContextMenu: state.showContextMenu,
      hideContextMenu: state.hideContextMenu,
    }),
    shallow,
  );

export const useUndoRedo = () =>
  useFlowStore(
    (state) => ({
      undo: state.undo,
      redo: state.redo,
      canUndo: state.history.past.length > 0,
      canRedo: state.history.future.length > 0,
    }),
    shallow,
  );

/**
 * Flags de UI provenientes de useTrainingStore.
 */
export const useUIFlags = () =>
  useTrainingStore(
    state => ({
      showSimulation: state.showSimulation,
      showTemplateSelector: state.showTemplateSelector,
      showExportMode: state.showExportMode,
      showConnectionEditor: state.showConnectionEditor,
      showRouteAnalysis: state.showRouteAnalysis,
      showVersionHistoryPanel: state.showVersionHistoryPanel,
      showSuggestionsModal: state.showSuggestionsModal,
      showEmbedModal: state.showEmbedModal,
    }),
    shallow,
  );

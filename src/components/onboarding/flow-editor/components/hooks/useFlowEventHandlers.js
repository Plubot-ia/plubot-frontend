/**
 * useFlowEventHandlers.js
 * Custom hook to manage all FlowMain event handlers
 * Reduces complexity by extracting event handling logic
 */

import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import useFlowStore from '@/stores/use-flow-store';

import { useEdgeEventHandlers } from './useEdgeEventHandlers';

/**
 * Helper: Sanitizar paths de aristas antes de aplicar los cambios
 */
const sanitizeEdgeChanges = (changes) => {
  return changes.map((change) => {
    if (change.type === 'add' && change.item && change.item.data && change.item.data.path) {
      return {
        ...change,
        item: {
          ...change.item,
          data: {
            ...change.item.data,
            path: change.item.data.path.replaceAll('NaN', '0'),
          },
        },
      };
    }
    return change;
  });
};

/**
 * Helper: Crear nodo duplicado
 */
const createDuplicatedNode = (nodeToDuplicate) => ({
  id: uuidv4(),
  type: nodeToDuplicate.type,
  position: {
    x: nodeToDuplicate.position.x + 40,
    y: nodeToDuplicate.position.y + 40,
  },
  data: structuredClone(nodeToDuplicate.data),
});

/**
 * Hook for node-related event handlers
 */
const useNodeEventHandlers = ({
  externalOnNodeClick,
  externalOnNodeDragStart,
  externalOnNodeDrag,
  externalOnNodeDragStop,
  externalOnNodesDelete,
  setIsDragging,
  closeContextMenu,
  setIsNodeBeingDragged: _setIsNodeBeingDragged, // Prefixed with _ to indicate intentionally unused
}) => {
  // PERFORMANCE OPTIMIZATION: Throttle drag events using RAF for better performance
  const dragThrottleRef = useRef(null);
  const isDragThrottled = useRef(false);
  const handleDuplicateNode = useCallback(
    (nodeToDuplicate) => {
      const newNode = createDuplicatedNode(nodeToDuplicate);
      useFlowStore.getState().addNode(newNode);
      closeContextMenu();
    },
    [closeContextMenu],
  );

  const handleEditNode = useCallback(
    (_nodeToEdit) => {
      closeContextMenu();
    },
    [closeContextMenu],
  );

  const handleNodeClick = useCallback(
    (event, node) => {
      if (externalOnNodeClick) {
        externalOnNodeClick(event, node);
      }
      closeContextMenu();
    },
    [externalOnNodeClick, closeContextMenu],
  );

  const onNodeDragStart = useCallback(
    (event, node) => {
      setIsDragging(true);
      // OPTIMIZATION: Disabled global drag state to prevent massive re-renders
      // Now using selective node tracking in useDraggingNodeTracker
      // setIsNodeBeingDragged(true);
      if (externalOnNodeDragStart) {
        externalOnNodeDragStart(event, node);
      }
    },
    [externalOnNodeDragStart, setIsDragging],
  );

  const onNodeDrag = useCallback(
    (event, node) => {
      // ULTRA PERFORMANCE OPTIMIZATION: Use RAF throttling for smooth drag
      if (!isDragThrottled.current) {
        isDragThrottled.current = true;

        dragThrottleRef.current = requestAnimationFrame(() => {
          if (externalOnNodeDrag) {
            externalOnNodeDrag(event, node);
          }
          isDragThrottled.current = false;
        });
      }
    },
    [externalOnNodeDrag],
  );

  const handleNodeDragStop = useCallback(
    (event, node) => {
      setIsDragging(false);
      // OPTIMIZATION: Disabled global drag state to prevent massive re-renders
      // Now using selective node tracking in useDraggingNodeTracker
      // setIsNodeBeingDragged(false);
      if (externalOnNodeDragStop) {
        externalOnNodeDragStop(event, node);
      }
    },
    [externalOnNodeDragStop, setIsDragging],
  );

  const handleNodesDelete = useCallback(
    (nodesToDelete) => {
      if (externalOnNodesDelete) {
        externalOnNodesDelete(nodesToDelete);
      }
      closeContextMenu();
    },
    [externalOnNodesDelete, closeContextMenu],
  );

  const onNodesDelete = useCallback(
    (nodesToDelete) => {
      // MEJORA: Eliminar condiciones de DecisionNode cuando se suprime OptionNode directamente

      // Procesar cada nodo que se va a eliminar
      for (const nodeToDelete of nodesToDelete) {
        // Si es un OptionNode, eliminar la condición correspondiente del DecisionNode padre
        if (
          nodeToDelete.type === 'option' &&
          nodeToDelete.data?.sourceNode &&
          nodeToDelete.data?.conditionId
        ) {
          // Usar el store para eliminar la condición
          const { deleteDecisionNodeCondition } = useFlowStore.getState();
          try {
            deleteDecisionNodeCondition(
              nodeToDelete.data.sourceNode,
              nodeToDelete.data.conditionId,
            );
          } catch {}
        }
      }

      // Llamar al handler externo después de procesar
      if (externalOnNodesDelete) externalOnNodesDelete(nodesToDelete);
    },
    [externalOnNodesDelete],
  );

  return {
    handleDuplicateNode,
    handleEditNode,
    handleNodeClick,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop: handleNodeDragStop,
    handleNodesDelete,
    onNodesDelete,
  };
};

/**
 * Custom hook for FlowMain event handlers
 */
export const useFlowEventHandlers = ({
  externalOnNodesChange: _externalOnNodesChange,
  externalOnEdgesChange: _externalOnEdgesChange,
  externalOnConnect: _externalOnConnect,
  externalOnNodeClick,
  externalOnPaneClick,
  externalOnEdgeClick,
  externalOnNodeDragStart,
  externalOnNodeDrag,
  externalOnNodeDragStop,
  externalOnDragOver,
  externalOnDrop,
  externalOnEdgeUpdate,
  externalOnEdgeUpdateStart,
  externalOnEdgeUpdateEnd,
  externalOnNodesDelete,
  externalOnEdgesDelete,
  externalOnSelectionChange,
  externalValidConnectionsHandles,
  isDragging,
  setIsDragging,
  closeContextMenu,
  handlePaneClickForMenu,
}) => {
  // OPTIMIZED: Select store actions individually to prevent unnecessary re-renders
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);

  // Get node handlers from the dedicated hook
  const nodeHandlers = useNodeEventHandlers({
    externalOnNodeClick,
    externalOnNodeDragStart,
    externalOnNodeDrag,
    externalOnNodeDragStop,
    externalOnNodesDelete,
    setIsDragging,
    closeContextMenu,
    setIsNodeBeingDragged: useFlowStore((state) => state.setIsNodeBeingDragged),
  });

  // Get edge handlers from the dedicated hook
  const edgeHandlers = useEdgeEventHandlers({
    externalOnEdgeClick,
    externalOnEdgeUpdate,
    externalOnEdgeUpdateStart,
    externalOnEdgeUpdateEnd,
    externalOnEdgesDelete,
    externalOnDragOver,
    externalOnDrop,
    externalValidConnectionsHandles,
    closeContextMenu,
  });

  const handleEdgesChange = useCallback(
    (changes) => {
      const sanitizedChanges = sanitizeEdgeChanges(changes);
      if (_externalOnEdgesChange) {
        _externalOnEdgesChange(sanitizedChanges);
      } else {
        onEdgesChange(sanitizedChanges);
      }
    },
    [_externalOnEdgesChange, onEdgesChange],
  );

  const handleConnect = useCallback(
    (parameters) => {
      if (_externalOnConnect) {
        _externalOnConnect(parameters);
      } else {
        onConnect(parameters);
      }
    },
    [_externalOnConnect, onConnect],
  );

  const handlePaneClick = useCallback(
    (event) => {
      handlePaneClickForMenu(event);
      if (externalOnPaneClick) {
        externalOnPaneClick(event);
      }
    },
    [externalOnPaneClick, handlePaneClickForMenu],
  );

  const onSelectionChange = useCallback(
    (parameters) => {
      const shouldProcess = !isDragging;
      if (externalOnSelectionChange && shouldProcess) {
        externalOnSelectionChange(parameters);
      }
    },
    [externalOnSelectionChange, isDragging],
  );

  return {
    onNodesChange,
    handleEdgesChange,
    handleConnect,
    handlePaneClick,
    onSelectionChange,
    // Spread node handlers
    ...nodeHandlers,
    // Spread edge handlers
    ...edgeHandlers,
  };
};

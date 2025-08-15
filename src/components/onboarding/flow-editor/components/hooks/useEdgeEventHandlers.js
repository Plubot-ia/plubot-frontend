/**
 * useEdgeEventHandlers.js
 * Custom hook for edge-related event handlers
 * Further reduces useFlowEventHandlers complexity
 */

import { useCallback } from 'react';

import useFlowStore from '@/stores/use-flow-store';

import { calculateCorrectDropPosition } from '../../drop-position-fix';

/**
 * Custom hook for edge-related event handlers
 */
export const useEdgeEventHandlers = ({
  externalOnEdgeClick,
  externalOnEdgeUpdate,
  externalOnEdgeUpdateStart,
  externalOnEdgeUpdateEnd,
  externalOnEdgesDelete,
  externalOnDragOver,
  externalOnDrop,
  externalValidConnectionsHandles,
  closeContextMenu,
}) => {
  const handleEdgeClick = useCallback(
    (event, edge) => {
      if (externalOnEdgeClick) {
        externalOnEdgeClick(event, edge);
      }
      closeContextMenu();
    },
    [externalOnEdgeClick, closeContextMenu],
  );

  const onEdgeUpdateStart = useCallback(
    (event, edge) => {
      if (externalOnEdgeUpdateStart) {
        externalOnEdgeUpdateStart(event, edge);
      }
    },
    [externalOnEdgeUpdateStart],
  );

  const onEdgeUpdateEnd = useCallback(
    (event, edge) => {
      if (externalOnEdgeUpdateEnd) {
        externalOnEdgeUpdateEnd(event, edge);
      }
    },
    [externalOnEdgeUpdateEnd],
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete) => {
      const localEdges = edgesToDelete;
      if (externalOnEdgesDelete) {
        externalOnEdgesDelete(localEdges);
      }
    },
    [externalOnEdgesDelete],
  );

  const handleEdgesDelete = useCallback(
    (edgesToDelete) => {
      if (externalOnEdgesDelete) {
        externalOnEdgesDelete(edgesToDelete);
      }
      closeContextMenu();
    },
    [externalOnEdgesDelete, closeContextMenu],
  );

  const handleDragOver = useCallback(
    (event) => {
      if (externalOnDragOver) {
        externalOnDragOver(event);
      } else {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }
    },
    [externalOnDragOver],
  );

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (externalOnDrop) {
        externalOnDrop(event);
        return;
      }

      try {
        const nodeType = event.dataTransfer.getData('application/reactflow');
        if (!nodeType) {
          return;
        }

        const position = calculateCorrectDropPosition(event);
        const newNode = {
          id: `${nodeType.toLowerCase()}-${Date.now()}`,
          type: nodeType,
          position,
          data: { label: `Nuevo ${nodeType}` },
          dragHandle: '.custom-drag-handle',
        };

        useFlowStore.getState().addNode(newNode);
      } catch {
        // Error handling without logging
      }
    },
    [externalOnDrop],
  );

  const handleEdgeUpdate = useCallback(
    (oldEdge, newConnection) => {
      if (externalOnEdgeUpdate) {
        externalOnEdgeUpdate(oldEdge, newConnection);
      }
    },
    [externalOnEdgeUpdate],
  );

  const isValidConnection = useCallback(
    (connection) => {
      if (typeof externalValidConnectionsHandles === 'function') {
        return externalValidConnectionsHandles(connection);
      }
      return true;
    },
    [externalValidConnectionsHandles],
  );

  return {
    handleEdgeClick,
    onEdgeUpdateStart,
    onEdgeUpdateEnd,
    onEdgesDelete,
    handleEdgesDelete,
    handleDragOver,
    handleDrop,
    handleEdgeUpdate,
    isValidConnection,
  };
};

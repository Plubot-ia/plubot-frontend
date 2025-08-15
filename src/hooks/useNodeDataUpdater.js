import { useCallback } from 'react';

export const useNodeDataUpdater = ({
  id,
  onNodesChange,
  getNode,
  trackNodeEdit,
  addToHistory,
  currentUser,
  setIsEditing,
}) => {
  const updateNodeData = useCallback(
    (newData, trackingInfo = {}) => {
      const { nodeType, previousValue, closeOnSave = true } = trackingInfo;

      onNodesChange([
        {
          type: 'change',
          item: { id, data: { ...getNode(id)?.data, ...newData } },
        },
      ]);

      trackNodeEdit?.(id, nodeType ?? 'generic', newData);
      addToHistory?.(id, {
        action: 'edit',
        timestamp: new Date().toISOString(),
        user: currentUser ?? 'unknown',
        previousValue,
        newValue: newData,
      });

      if (closeOnSave) {
        setIsEditing(false);
      }
    },
    [id, onNodesChange, getNode, trackNodeEdit, addToHistory, currentUser, setIsEditing],
  );

  return { updateNodeData };
};

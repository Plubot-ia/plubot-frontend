import { useCallback } from 'react';

export const useNodeEvents = ({
  isCollapsed,
  setIsCollapsed,
  onNodesChange,
  getNode,
  id,
  setContextMenuPosition,
  setShowContextMenu,
  data,
  canEdit,
  showError,
  setIsEditing,
}) => {
  const toggleCollapse = useCallback(
    (event) => {
      event.stopPropagation();
      const newCollapsed = !isCollapsed;
      setIsCollapsed(newCollapsed);
      onNodesChange([
        {
          type: 'change',
          item: {
            id,
            data: { ...getNode(id)?.data, isCollapsed: newCollapsed },
          },
        },
      ]);
    },
    [isCollapsed, id, onNodesChange, getNode, setIsCollapsed],
  );

  const handleContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
      setShowContextMenu(true);
    },
    [setContextMenuPosition, setShowContextMenu],
  );

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation();
      if (data.onSelect) {
        data.onSelect();
      }
    },
    [data],
  );

  const handleDoubleClick = useCallback(() => {
    if (!canEdit) {
      showError('No tienes permisos para editar este nodo');
      return;
    }
    setIsEditing(true);
  }, [canEdit, showError, setIsEditing]);

  return {
    toggleCollapse,
    handleContextMenu,
    handleClick,
    handleDoubleClick,
  };
};

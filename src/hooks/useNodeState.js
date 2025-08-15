import { useState } from 'react';

export const useNodeState = (initialData) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialData.isCollapsed ?? false);
  const [isEditing, setIsEditing] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  return {
    isResizing,
    setIsResizing,
    isCollapsed,
    setIsCollapsed,
    isEditing,
    setIsEditing,
    showContextMenu,
    setShowContextMenu,
    contextMenuPosition,
    setContextMenuPosition,
    errorMessage,
    setErrorMessage,
    isHovered,
    setIsHovered,
  };
};

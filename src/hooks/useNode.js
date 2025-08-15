import PropTypes from 'prop-types';
import { useEffect, useRef, useCallback } from 'react';
import { useReactFlow } from 'reactflow';

import { useNodeHistory } from '@/hooks/legacy-compatibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePermissions } from '@/hooks/usePermissions';

import { useNodeDataUpdater } from './useNodeDataUpdater';
import { useNodeEvents } from './useNodeEvents';
import { useNodeResize } from './useNodeResize';
import { useNodeReturn } from './useNodeReturn';
import { useNodeState } from './useNodeState';
import { useNodeStatus } from './useNodeStatus';

const useNode = ({
  id,
  data = {},
  onNodesChange,
  isConnectable = true,
  minWidth = 120,
  minHeight = 80,
}) => {
  const {
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
  } = useNodeState(data);

  const nodeReference = useRef(undefined);

  const { trackNodeEdit } = useAnalytics() ?? {};
  const { addToHistory } = useNodeHistory() ?? {};
  const { canEdit = true, canDelete = true } = usePermissions() ?? {};
  const { getNode } = useReactFlow() ?? {};

  const initialWidth = data.width || minWidth;
  const initialHeight = data.height || minHeight;

  const showError = useCallback(
    (message) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 3000);
    },
    [setErrorMessage],
  );

  useEffect(() => {
    if (typeof data.isCollapsed === 'boolean' && data.isCollapsed !== isCollapsed) {
      setIsCollapsed(data.isCollapsed);
    }
  }, [data.isCollapsed, isCollapsed, setIsCollapsed]);

  const { handleMouseDown } = useNodeResize({
    id,
    onNodesChange,
    minWidth,
    minHeight,
    nodeReference,
    isResizing,
    setIsResizing,
    canEdit,
    showError,
    trackNodeEdit,
    getNode,
  });

  const { toggleCollapse, handleContextMenu, handleClick, handleDoubleClick } = useNodeEvents({
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
  });

  const { updateNodeData } = useNodeDataUpdater({
    id,
    onNodesChange,
    getNode,
    trackNodeEdit,
    addToHistory,
    currentUser: data.currentUser,
    setIsEditing,
  });

  const { getStatusClass } = useNodeStatus(data.status);

  return useNodeReturn({
    isResizing,
    isCollapsed,
    isEditing,
    setIsEditing,
    showContextMenu,
    contextMenuPosition,
    errorMessage,
    isHovered,
    nodeReference,
    toggleCollapse,
    handleContextMenu,
    handleClick,
    handleMouseDown,
    handleDoubleClick,
    updateNodeData,
    setShowContextMenu,
    setIsHovered,
    showError,
    getStatusClass,
    canEdit,
    canDelete,
    isConnectable,
    minWidth,
    minHeight,
    initialWidth,
    initialHeight,
  });
};

useNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  onNodesChange: PropTypes.func.isRequired,
  isConnectable: PropTypes.bool,
  minWidth: PropTypes.number,
  minHeight: PropTypes.number,
};

export default useNode;

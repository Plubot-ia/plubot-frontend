import PropTypes from 'prop-types';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useReactFlow } from 'reactflow';

import { useNodeHistory } from '@/hooks/legacy-compatibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePermissions } from '@/hooks/usePermissions';

const useNode = ({
  id,
  data = {},
  onNodesChange,
  isConnectable = true,
  minWidth = 120,
  minHeight = 80,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
  const [isEditing, setIsEditing] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const nodeReference = useRef(undefined);
  const resizeObserver = useRef(undefined);

  const { trackNodeEdit } = useAnalytics() || {};
  const { addToHistory } = useNodeHistory() || {};
  const { canEdit = true, canDelete = true } = usePermissions() || {};
  const { getNode } = useReactFlow() || {};

  const initialWidth = data.width || minWidth;
  const initialHeight = data.height || minHeight;

  const showError = useCallback((message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  }, []);

  useEffect(() => {
    if (
      typeof data.isCollapsed === 'boolean' &&
      data.isCollapsed !== isCollapsed
    ) {
      setIsCollapsed(data.isCollapsed);
    }
  }, [data.isCollapsed, isCollapsed]);

  useEffect(() => {
    if (nodeReference.current) {
      resizeObserver.current = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        if (width < minWidth || height < minHeight) {
          setTimeout(() => {
            onNodesChange([
              {
                type: 'change',
                item: {
                  id,
                  width: Math.max(width, minWidth),
                  height: Math.max(height, minHeight),
                },
              },
            ]);
          }, 0);
        }
      });
      resizeObserver.current.observe(nodeReference.current);
    }
    return () => {
      resizeObserver.current?.disconnect();
    };
  }, [id, minWidth, minHeight, onNodesChange]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!isResizing || !nodeReference.current) return;

      const node = getNode(id);
      if (!node) return;

      const newWidth = Math.max(minWidth, node.width + event.movementX);
      const newHeight = Math.max(minHeight, node.height + event.movementY);

      onNodesChange([
        { type: 'change', item: { id, width: newWidth, height: newHeight } },
      ]);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      const node = getNode(id);
      if (node) {
        trackNodeEdit?.(id, 'resize', {
          width: node.width,
          height: node.height,
        });
      }
    };

    if (isResizing) {
      globalThis.addEventListener('mousemove', handleMouseMove);
      globalThis.addEventListener('mouseup', handleMouseUp, { once: true });
    }

    return () => {
      globalThis.removeEventListener('mousemove', handleMouseMove);
    };
  }, [
    id,
    isResizing,
    minWidth,
    minHeight,
    onNodesChange,
    initialWidth,
    initialHeight,
    getNode,
    trackNodeEdit,
  ]);

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
    [isCollapsed, id, onNodesChange, getNode],
  );

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setShowContextMenu(true);
  }, []);

  const handleClick = useCallback(
    (event) => {
      event.stopPropagation();
      if (data.onSelect) {
        data.onSelect();
      }
    },
    [data],
  );

  const handleMouseDown = useCallback(
    (event) => {
      event.stopPropagation();
      if (!canEdit) {
        showError('No tienes permisos para redimensionar este nodo');
        return;
      }
      setIsResizing(true);
    },
    [canEdit, showError],
  );

  const handleDoubleClick = useCallback(() => {
    if (!canEdit) {
      showError('No tienes permisos para editar este nodo');
      return;
    }
    setIsEditing(true);
  }, [canEdit, showError]);

  const updateNodeData = useCallback(
    (newData, trackingInfo = {}) => {
      const { nodeType, previousValue, closeOnSave = true } = trackingInfo;

      onNodesChange([
        {
          type: 'change',
          item: { id, data: { ...getNode(id)?.data, ...newData } },
        },
      ]);

      trackNodeEdit?.(id, nodeType || 'generic', newData);
      addToHistory?.(id, {
        action: 'edit',
        timestamp: new Date().toISOString(),
        user: data.currentUser || 'unknown',
        previousValue,
        newValue: newData,
      });

      if (closeOnSave) {
        setIsEditing(false);
      }
    },
    [id, onNodesChange, getNode, trackNodeEdit, addToHistory, data.currentUser],
  );

  const getStatusClass = useCallback(() => {
    const statusMap = {
      success: 'node-status-success',
      warning: 'node-status-warning',
      error: 'node-status-error',
      processing: 'node-status-processing',
      inactive: 'node-status-inactive',
    };
    return statusMap[data.status] || '';
  }, [data.status]);

  return {
    isResizing,
    isCollapsed,
    isEditing,
    setIsEditing,
    showContextMenu,
    contextMenuPosition,
    errorMessage,
    isHovered,
    nodeRef: nodeReference,
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
  };
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

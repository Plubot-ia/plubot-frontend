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

  // Añadir defensas para hooks
  const analytics = useAnalytics() || {};
  const {
    trackNodeEdit = () => {
      /* Placeholder */
    },
    trackNodeConnected = () => {
      /* Placeholder */
    },
  } = analytics;
  const history = useNodeHistory() || {};
  const {
    addToHistory = () => {
      /* Placeholder */
    },
  } = history;
  const permissions = usePermissions() || {};
  const { canEdit = true, canDelete = true } = permissions;
  const reactFlow = useReactFlow() || {};
  const {
    getNode = () => {},
    setNodes: setFlowNodes = () => {
      /* Placeholder */
    },
  } = reactFlow;

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
    const handleMouseMove = (e) => {
      if (!isResizing || !nodeReference.current) return;
      onNodesChange([
        {
          type: 'change',
          item: {
            id,
            width: Math.max(
              minWidth,
              (getNode(id)?.width || initialWidth) + e.movementX,
            ),
            height: Math.max(
              minHeight,
              (getNode(id)?.height || initialHeight) + e.movementY,
            ),
          },
        },
      ]);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        const node = getNode(id);
        if (node) {
          trackNodeEdit(id, 'resize', {
            width: node.width,
            height: node.height,
          });
        }
      }
    };

    if (isResizing) {
      globalThis.addEventListener('mousemove', handleMouseMove);
      globalThis.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      globalThis.removeEventListener('mousemove', handleMouseMove);
      globalThis.removeEventListener('mouseup', handleMouseUp);
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
    (e) => {
      e.stopPropagation();
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

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (data.onSelect) {
        data.onSelect();
      }
    },
    [data],
  );

  const handleMouseDown = useCallback(
    (e) => {
      e.stopPropagation();
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

  const saveChanges = useCallback(
    (updateData, previousData, nodeType) => {
      onNodesChange([
        {
          type: 'change',
          item: {
            id,
            data: { ...getNode(id)?.data, ...updateData },
          },
        },
      ]);
      trackNodeEdit(id, nodeType, updateData);
      addToHistory(id, {
        action: 'edit',
        timestamp: new Date().toISOString(),
        user: data.currentUser || 'unknown',
        previousValue: previousData,
        newValue: updateData,
      });
      setIsEditing(false);
    },
    [id, onNodesChange, getNode, trackNodeEdit, addToHistory, data.currentUser],
  );

  const trackChanges = useCallback(
    (nodeType, updateData, previousValue, newValue) => {
      trackNodeEdit(id, nodeType, updateData);
      addToHistory(id, {
        action: 'edit',
        timestamp: new Date().toISOString(),
        user: data.currentUser || 'unknown',
        previousValue,
        newValue,
      });
    },
    [id, trackNodeEdit, addToHistory, data.currentUser],
  );

  const getStatusClass = useCallback(() => {
    switch (data.status) {
      case 'success': {
        return 'node-status-success';
      }
      case 'warning': {
        return 'node-status-warning';
      }
      case 'error': {
        return 'node-status-error';
      }
      case 'processing': {
        return 'node-status-processing';
      }
      case 'inactive': {
        return 'node-status-inactive';
      }
      default: {
        return '';
      }
    }
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
    saveChanges,
    setShowContextMenu,
    setIsHovered,
    showError,
    getStatusClass,
    trackChanges,
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
  setNodes: PropTypes.func.isRequired,
  isConnectable: PropTypes.bool,
  minWidth: PropTypes.number,
  minHeight: PropTypes.number,
};

export default useNode;

import { useState, useEffect, useRef, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useNodeHistory } from '@/hooks/useNodeHistory';
import { usePermissions } from '@/hooks/usePermissions';
import PropTypes from 'prop-types';

const useNode = ({ id, data = {}, setNodes, isConnectable = true, minWidth = 120, minHeight = 80 }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
  const [isEditing, setIsEditing] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const nodeRef = useRef(null);
  const resizeObserver = useRef(null);

  // Añadir defensas para hooks
  const analytics = useAnalytics() || {};
  const { trackNodeEdit = () => {}, trackNodeConnected = () => {} } = analytics;
  const history = useNodeHistory() || {};
  const { addToHistory = () => {} } = history;
  const permissions = usePermissions() || {};
  const { canEdit = true, canDelete = true } = permissions;
  const reactFlow = useReactFlow() || {};
  const { getNode = () => null, setNodes: setFlowNodes = () => {} } = reactFlow;

  const initialWidth = data.width || minWidth;
  const initialHeight = data.height || minHeight;

  useEffect(() => {
    if (typeof data.isCollapsed === 'boolean' && data.isCollapsed !== isCollapsed) {
      setIsCollapsed(data.isCollapsed);
    }
  }, [data.isCollapsed, isCollapsed]);

  useEffect(() => {
    if (nodeRef.current) {
      resizeObserver.current = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        if (width < minWidth || height < minHeight) {
          setTimeout(() => {
            setFlowNodes((nds) =>
              nds.map((node) =>
                node.id === id
                  ? { ...node, width: Math.max(width, minWidth), height: Math.max(height, minHeight) }
                  : node
              )
            );
          }, 0);
        }
      });
      resizeObserver.current.observe(nodeRef.current);
    }
    return () => {
      resizeObserver.current?.disconnect();
    };
  }, [id, minWidth, minHeight, setFlowNodes]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !nodeRef.current) return;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            const newWidth = Math.max(minWidth, (node.width || initialWidth) + e.movementX);
            const newHeight = Math.max(minHeight, (node.height || initialHeight) + e.movementY);
            return { ...node, width: newWidth, height: newHeight };
          }
          return node;
        })
      );
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        const node = getNode(id);
        if (node) {
          trackNodeEdit(id, 'resize', { width: node.width, height: node.height });
        }
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, id, setNodes, getNode, trackNodeEdit, minWidth, minHeight, initialWidth, initialHeight]);

  const toggleCollapse = useCallback(
    (e) => {
      e.stopPropagation();
      const newCollapsed = !isCollapsed;
      setIsCollapsed(newCollapsed);
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, isCollapsed: newCollapsed } } : node
        )
      );
    },
    [isCollapsed, id, setNodes]
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
    [data]
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
    [canEdit]
  );

  const handleDoubleClick = useCallback(() => {
    if (!canEdit) {
      showError('No tienes permisos para editar este nodo');
      return;
    }
    setIsEditing(true);
  }, [canEdit]);

  const saveChanges = useCallback(
    (updateData, previousData, nodeType) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? {
                ...node,
                data: { ...node.data, ...updateData },
              }
            : node
        )
      );
      // Llamar a trackNodeEdit y addToHistory directamente
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
    [id, setNodes, trackNodeEdit, addToHistory, data.currentUser]
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
    [id, trackNodeEdit, addToHistory, data.currentUser]
  );

  const showError = useCallback((message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  }, []);

  const getStatusClass = useCallback(() => {
    switch (data.status) {
      case 'success':
        return 'node-status-success';
      case 'warning':
        return 'node-status-warning';
      case 'error':
        return 'node-status-error';
      case 'processing':
        return 'node-status-processing';
      case 'inactive':
        return 'node-status-inactive';
      default:
        return '';
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
    nodeRef,
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
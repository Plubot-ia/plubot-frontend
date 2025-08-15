import { useEffect } from 'react';

import { useResizeObserver } from './useResizeObserver';

export const useNodeResize = ({
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
}) => {
  useResizeObserver({
    nodeReference,
    onNodesChange,
    id,
    minWidth,
    minHeight,
  });

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!isResizing || !nodeReference.current) return;

      const node = getNode(id);
      if (!node) return;

      const newWidth = Math.max(minWidth, node.width + event.movementX);
      const newHeight = Math.max(minHeight, node.height + event.movementY);

      onNodesChange([{ type: 'change', item: { id, width: newWidth, height: newHeight } }]);
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
    getNode,
    trackNodeEdit,
    nodeReference,
    setIsResizing,
  ]);

  const handleMouseDown = (event) => {
    event.stopPropagation();
    if (!canEdit) {
      showError('No tienes permisos para redimensionar este nodo');
      return;
    }
    setIsResizing(true);
  };

  return { handleMouseDown };
};

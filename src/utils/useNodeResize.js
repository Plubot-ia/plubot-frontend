// src/utils/useNodeResize.js
import { useState, useCallback, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useReactFlow } from 'reactflow';

export const useNodeResize = (nodeId, initialWidth, initialHeight, minWidth = 100, minHeight = 60) => {
  const [isResizing, setIsResizing] = useState(false);
  const { trackNodeEdit } = useAnalytics();
  const { getNode, setNodes } = useReactFlow();

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation(); // Evita que React Flow interprete esto como arrastre
    e.preventDefault(); // Evita comportamientos predeterminados del navegador
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing) return;

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const currentWidth = node.data?.width || node.style?.width || initialWidth;
            const currentHeight = node.data?.height || node.style?.height || initialHeight;
            const newWidth = Math.max(minWidth, currentWidth + e.movementX);
            const newHeight = Math.max(minHeight, currentHeight + e.movementY);

            return {
              ...node,
              style: { ...node.style, width: newWidth, height: newHeight }, // Actualiza el estilo para el DOM
              data: { ...node.data, width: newWidth, height: newHeight }, // Persiste en data
            };
          }
          return node;
        })
      );
    },
    [isResizing, nodeId, setNodes, initialWidth, initialHeight, minWidth, minHeight]
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      const node = getNode(nodeId);
      if (node) {
        trackNodeEdit(nodeId, 'resize', { width: node.data?.width, height: node.data?.height });
      }
    }
  }, [isResizing, getNode, nodeId, trackNodeEdit]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return { isResizing, handleMouseDown };
};
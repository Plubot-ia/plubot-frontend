// src/utils/useNodeResize.js
import { throttle } from 'lodash';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useReactFlow } from 'reactflow';

import { useAnalytics } from '@/hooks/useAnalytics';

export const useNodeResize = (
  nodeId,
  initialWidth,
  initialHeight,
  minWidth = 100,
  minHeight = 60,
) => {
  const [isResizing, setIsResizing] = useState(false);
  const { trackNodeEdit } = useAnalytics();
  const { getNode, setNodes } = useReactFlow();

  const handleMouseDown = useCallback((event) => {
    event.stopPropagation(); // Evita que React Flow interprete esto como arrastre
    event.preventDefault(); // Evita comportamientos predeterminados del navegador
    setIsResizing(true);
  }, []);

  const throttledSetNodes = useMemo(
    () =>
      throttle((updater) => {
        setNodes(updater);
      }, 16), // Throttle to ~60fps, ensuring smooth but controlled updates
    [setNodes],
  );

  const handleMouseMove = useCallback(
    (event) => {
      if (!isResizing) return;

      throttledSetNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const currentWidth =
              node.data?.width || node.style?.width || initialWidth;
            const currentHeight =
              node.data?.height || node.style?.height || initialHeight;
            const newWidth = Math.max(minWidth, currentWidth + event.movementX);
            const newHeight = Math.max(
              minHeight,
              currentHeight + event.movementY,
            );

            return {
              ...node,
              style: { ...node.style, width: newWidth, height: newHeight },
              data: { ...node.data, width: newWidth, height: newHeight },
            };
          }
          return node;
        }),
      );
    },
    [
      isResizing,
      nodeId,
      throttledSetNodes,
      initialWidth,
      initialHeight,
      minWidth,
      minHeight,
    ],
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      const node = getNode(nodeId);
      if (node) {
        trackNodeEdit(nodeId, 'resize', {
          width: node.data?.width,
          height: node.data?.height,
        });
      }
    }
  }, [isResizing, getNode, nodeId, trackNodeEdit]);

  useEffect(() => {
    if (isResizing) {
      globalThis.addEventListener('mousemove', handleMouseMove);
      globalThis.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      globalThis.removeEventListener('mousemove', handleMouseMove);
      globalThis.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return { isResizing, handleMouseDown };
};

import { useEffect, useRef } from 'react';

export const useResizeObserver = ({ nodeReference, onNodesChange, id, minWidth, minHeight }) => {
  const resizeObserver = useRef(undefined);

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
  }, [id, minWidth, minHeight, onNodesChange, nodeReference]);
};

import { useState, useEffect } from 'react';

const useMousePosition = (containerReference) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (containerReference.current) {
        const rect = containerReference.current.getBoundingClientRect();
        setCursorPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    };

    globalThis.addEventListener('mousemove', handleMouseMove);
    return () => globalThis.removeEventListener('mousemove', handleMouseMove);
  }, [containerReference]);

  return cursorPosition;
};

export default useMousePosition;

import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para seguir la posición del mouse dentro de un contenedor
 * @returns {Object} - Objeto con la posición del mouse y la referencia al contenedor
 */
const useMouseTracker = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerReference = useRef(undefined);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (containerReference.current) {
        const rect = containerReference.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setMousePosition({ x, y });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return {
    mousePosition,
    containerRef: containerReference,
  };
};

export default useMouseTracker;

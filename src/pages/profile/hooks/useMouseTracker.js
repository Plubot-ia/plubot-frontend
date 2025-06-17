import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para seguir la posición del mouse dentro de un contenedor
 * @returns {Object} - Objeto con la posición del mouse y la referencia al contenedor
 */
const useMouseTracker = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
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
    containerRef
  };
};

export default useMouseTracker;

import { useState, useEffect } from 'react';

/**
 * Hook personalizado para obtener las dimensiones de la ventana del navegador.
 * Proporciona una forma reactiva de acceder al ancho y alto de la ventana,
 * actualizándose automáticamente cuando el usuario redimensiona la ventana.
 *
 * @returns {object} Un objeto con las propiedades `width` y `height`.
 *                   Devuelve `undefined` para ambas en el servidor (SSR).
 */
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: globalThis.window === undefined ? undefined : window.innerWidth,
    height: globalThis.window === undefined ? undefined : window.innerHeight,
  });

  useEffect(() => {
    // Handler para llamar en el evento de redimensionamiento
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Añadir el event listener
    window.addEventListener('resize', handleResize);

    // Limpiar el event listener al desmontar el componente
    return () => window.removeEventListener('resize', handleResize);
  }, []); // El array vacío asegura que el efecto solo se ejecute al montar y desmontar

  return windowSize;
}

export default useWindowSize;

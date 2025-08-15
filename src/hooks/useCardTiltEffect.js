import { useEffect, useRef } from 'react';

/**
 * Un hook personalizado que aplica un efecto de inclinación 3D a un elemento
 * basado en la posición del cursor del ratón. Añade transiciones suaves para una mejor UX.
 *
 * @returns {React.RefObject} Una ref que debe ser adjuntada al elemento del DOM
 * que recibirá el efecto de inclinación.
 */
const useCardTiltEffect = () => {
  const cardRef = useRef(undefined);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) {
      return;
    }

    // Añadir una transición inicial para la entrada suave
    element.style.transition = 'transform 0.5s ease-in-out';

    const handleMouseMove = (event) => {
      const { clientX, clientY, currentTarget } = event;
      const { left, top, width, height } = currentTarget.getBoundingClientRect();
      const x = clientX - left;
      const y = clientY - top;
      const rotateX = (y / height - 0.5) * -25; // Efecto sutil, invertido para intuición
      const rotateY = (x / width - 0.5) * 25;

      // Transición rápida durante el movimiento
      currentTarget.style.transition = 'transform 0.05s ease-out';
      currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    };

    const handleMouseLeave = (event) => {
      // Transición suave al volver al estado original
      event.currentTarget.style.transition = 'transform 0.5s ease-in-out';
      event.currentTarget.style.transform =
        'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Función de limpieza para remover los event listeners
    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []); // El array de dependencias vacío asegura que el efecto se configura solo una vez

  return cardRef;
};

export default useCardTiltEffect;

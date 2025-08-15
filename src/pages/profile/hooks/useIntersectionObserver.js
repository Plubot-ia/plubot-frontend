import { useEffect, useState } from 'react';

/**
 * Hook personalizado para observar la visibilidad de un elemento usando IntersectionObserver.
 * @param {React.RefObject} elementRef - La referencia al elemento del DOM a observar.
 * @param {object} options - Opciones para el IntersectionObserver (root, rootMargin, threshold).
 * @returns {boolean} - Devuelve true si el elemento es visible.
 */
const useIntersectionObserver = (elementRef, options) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [elementRef, options]);

  return isVisible;
};

export default useIntersectionObserver;

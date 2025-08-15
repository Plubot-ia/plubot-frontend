import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar cuándo un elemento entra en el viewport.
 * @param {React.RefObject} ref - Referencia al elemento a observar.
 * @param {Object} options - Opciones para el IntersectionObserver.
 * @param {number} options.threshold - Umbral de visibilidad.
 * @param {string} options.rootMargin - Margen alrededor del root.
 * @returns {boolean} - True si el elemento está en el viewport.
 */
export function useIntersection(elementReference, { threshold = 0.1, rootMargin = '200px' } = {}) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    const currentRef = elementReference.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [elementReference, threshold, rootMargin]);

  return isInView;
}

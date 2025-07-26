import { gsap } from 'gsap';
import { useEffect } from 'react';

const useHeaderAnimations = (location) => {
  useEffect(() => {
    const logoImage = document.querySelector('.logo-image');
    const logoText = document.querySelector('.logo-text');
    const navbar = document.querySelector('.navbar');

    // Detener animaciones anteriores para evitar solapamientos
    if (logoImage) gsap.killTweensOf(logoImage);
    if (logoText) gsap.killTweensOf(logoText);
    if (navbar) gsap.killTweensOf(navbar);

    if (logoImage && logoText) {
      gsap.fromTo(
        logoImage,
        { opacity: 0, scale: 0.5, filter: 'blur(10px)' },
        {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.2,
          ease: 'power4.out',
          delay: 0.2,
        },
      );
      gsap.fromTo(
        logoText,
        { opacity: 0, x: -20, filter: 'blur(5px)' },
        {
          opacity: 1,
          x: 0,
          filter: 'blur(0px)',
          duration: 1.5,
          ease: 'power4.out',
          delay: 0.4,
          onComplete: () => {
            gsap.to(logoText, {
              scale: 1.02,
              duration: 2,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
          },
        },
      );
    }

    if (navbar) {
      gsap.fromTo(
        navbar,
        { y: -30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          onComplete: () => {
            // Optimización de rendimiento: desactiva will-change cuando la animación termina
            navbar.style.willChange = 'auto';
            navbar.style.transform = 'translateZ(0)';
          },
        },
      );
    }

    // Función de limpieza para detener las animaciones al desmontar el componente
    return () => {
      if (logoImage) gsap.killTweensOf(logoImage);
      if (logoText) gsap.killTweensOf(logoText);
      if (navbar) gsap.killTweensOf(navbar);
    };
  }, [location]);
};

export default useHeaderAnimations;

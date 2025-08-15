import { useEffect } from 'react';

// Función de ayuda para generar números aleatorios más seguros
const secureRandom = () => {
  return crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32 - 1);
};

export const useHistoryverseEffects = ({ heroRef, starsCanvasRef, width, height }) => {
  // Efecto para inicializar el canvas de estrellas
  useEffect(() => {
    const canvas = starsCanvasRef.current;
    let animationFrameId;

    if (canvas) {
      const context = canvas.getContext('2d');
      const stars = [];

      canvas.width = width ?? 0;
      canvas.height = height ?? 0;

      for (let index = 0; index < 200; index++) {
        stars.push({
          x: secureRandom() * canvas.width,
          y: secureRandom() * canvas.height,
          radius: secureRandom() * 1.5,
          opacity: secureRandom(),
          speed: secureRandom() * 0.05,
        });
      }

      const animateStars = () => {
        if (!context) return;
        context.clearRect(0, 0, canvas.width, canvas.height);

        for (const star of stars) {
          context.beginPath();
          context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          context.fillStyle = `rgba(0, 224, 255, ${star.opacity})`;
          context.fill();

          star.y += star.speed;

          if (star.y > canvas.height) {
            star.y = 0;
            star.x = secureRandom() * canvas.width;
          }
        }

        animationFrameId = requestAnimationFrame(animateStars);
      };

      animateStars();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [width, height, starsCanvasRef]);

  // Efecto para la animación del título
  useEffect(() => {
    const hero = heroRef.current;

    const handleLoad = () => {
      if (hero) {
        setTimeout(() => {
          hero.classList.add('animate-in');
        }, 300);
      }
    };

    if (hero) {
      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
      }
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [heroRef]);
};

import { useEffect } from 'react';

import useWindowSize from '../../../hooks/useWindowSize';

const useParticleAnimation = (canvasReference) => {
  const { width, height } = useWindowSize();

  useEffect(() => {
    const canvas = canvasReference.current;
    if (!canvas)
      return () => {
        /* no-op */
      };

    const context = canvas.getContext('2d');
    const particles = [];
    const particleCount = 30;

    canvas.width = width ?? 0;
    canvas.height = height ?? 0;

    // Sistema determinístico para partículas: más predecible, testeable y configurable
    // que generación aleatoria, manteniendo efectos visuales atractivos

    for (let index = 0; index < particleCount; index++) {
      // Generador pseudo-aleatorio determinístico basado en índice
      const seedFactor = (index * 17 + 31) % 1000; // 0-999 para mayor variación
      const normalizedSeed = seedFactor / 1000; // 0-1 para cálculos

      particles.push({
        // Posicionamiento determinístico basado en distribución uniforme
        x: (seedFactor * 1.618) % canvas.width, // Usar golden ratio para distribución natural
        y: (seedFactor * 2.414) % canvas.height, // Usar silver ratio para evitar patrones
        // Radio determinístico
        radius: 1 + (seedFactor % 2),
        color: '#00e0ff',
        // Velocidad determinística con distribución centrada en 0
        speedX: normalizedSeed - 0.5,
        speedY: ((seedFactor * 3) % 1000) / 1000 - 0.5,
        // Opacidad determinística
        opacity: 0.1 + (seedFactor % 300) / 1000,
      });
    }

    let lastFrame = 0;
    const drawParticles = (timestamp) => {
      if (!lastFrame) {
        lastFrame = timestamp;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particles) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1;
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1;
        }

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = particle.color;
        context.globalAlpha = particle.opacity;
        context.fill();
        context.closePath();
      }

      globalThis.requestAnimationFrame(drawParticles);
    };

    const animationFrameId = globalThis.requestAnimationFrame(drawParticles);

    return () => {
      globalThis.cancelAnimationFrame(animationFrameId);
    };
  }, [width, height, canvasReference]);
};

export default useParticleAnimation;

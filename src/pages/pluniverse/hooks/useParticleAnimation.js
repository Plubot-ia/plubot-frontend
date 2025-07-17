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

    canvas.width = width || 0;
    canvas.height = height || 0;

    // The use of Math.random is safe here as it's for a purely decorative animation
    // and does not require a cryptographically secure random number generator.

    for (let index = 0; index < particleCount; index++) {
      particles.push({
        // eslint-disable-next-line sonarjs/pseudo-random
        x: Math.random() * canvas.width,
        // eslint-disable-next-line sonarjs/pseudo-random
        y: Math.random() * canvas.height,
        // eslint-disable-next-line sonarjs/pseudo-random
        radius: Math.random() * 2 + 1,
        color: '#00e0ff',
        // eslint-disable-next-line sonarjs/pseudo-random
        speedX: Number(Math.random()) * 1 - 0.5,
        // eslint-disable-next-line sonarjs/pseudo-random
        speedY: Number(Math.random()) * 1 - 0.5,
        // eslint-disable-next-line sonarjs/pseudo-random
        opacity: Math.random() * 0.3 + 0.1,
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

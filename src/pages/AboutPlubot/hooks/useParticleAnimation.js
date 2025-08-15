import { useEffect, useRef, useCallback } from 'react';

import { getTypeColor } from '../utils/byte-helpers';
import { Particle } from '../utils/Particle';

const useParticleAnimation = (messages, showParticles) => {
  const canvasReference = useRef(undefined);
  const particlesReference = useRef([]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasReference.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
  }, []);

  const generateParticles = useCallback(({ x, y, color, count = 8 }) => {
    for (let index = 0; index < count; index++) {
      particlesReference.current.push(new Particle(x, y, color));
    }
  }, []);

  const generateParticlesInCanvas = useCallback(() => {
    const canvas = canvasReference.current;
    if (!canvas || !showParticles) return;

    const lastMessage = messages.at(-1);
    const color = getTypeColor(lastMessage?.type);
    const { width, height } = canvas;

    generateParticles({ x: width / 2, y: height / 2, color, count: 15 });
  }, [messages, showParticles, generateParticles]);

  const updateAndDrawParticles = useCallback(() => {
    const canvas = canvasReference.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    particlesReference.current = particlesReference.current.filter((particle) => particle.update());
    for (const particle of particlesReference.current) particle.draw(context);
  }, []);

  const animate = useCallback(() => {
    updateAndDrawParticles();
    requestAnimationFrame(animate);
  }, [updateAndDrawParticles]);

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas, animate]);

  useEffect(() => {
    generateParticlesInCanvas();
  }, [showParticles, messages, generateParticlesInCanvas]);

  return canvasReference;
};

export default useParticleAnimation;

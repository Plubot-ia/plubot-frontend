// src/utilities/ParticlesBackground.jsx
import { Particles } from '@tsparticles/react';
import { useCallback } from 'react';

const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    const { loadSlim } = await import('@tsparticles/slim');
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id='tsparticles'
      init={particlesInit}
      options={{
        fullScreen: { enable: false },
        background: { color: 'transparent' },
        particles: {
          number: { value: 80 },
          color: { value: ['#00e0ff', '#ff00ff'] },
          size: { value: 3 },
          move: { enable: true, speed: 0.6 },
          links: { enable: true, color: '#00e0ff', opacity: 0.4 },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'repulse' },
            resize: true,
          },
          modes: {
            repulse: { distance: 100 },
          },
        },
      }}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
};

export default ParticlesBackground;

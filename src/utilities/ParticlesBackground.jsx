// src/utilities/ParticlesBackground.jsx
import { Suspense, useCallback, useEffect, useState } from 'react';

const ParticlesBackground = () => {
  const [ParticlesComponent, setParticlesComponent] = useState(null);

  useEffect(() => {
    // Carga dinámica del módulo tsparticles
    import('tsparticles').then((module) => {
      setParticlesComponent(() => module.Particles);
    });
  }, []);

  const particlesInit = useCallback(async (engine) => {
    const { loadFull } = await import('tsparticles');
    await loadFull(engine);
  }, []);

  if (!ParticlesComponent) {
    return null; // No renderizamos nada hasta que el componente esté listo
  }

  return (
    <Suspense fallback={<div style={{ display: 'none' }} />}>
      <ParticlesComponent
        id="tsparticles"
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
    </Suspense>
  );
};

export default ParticlesBackground;
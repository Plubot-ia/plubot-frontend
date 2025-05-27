import { useEffect } from 'react';

const Particulas = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/particles.min.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.particlesJS('particles-js', {
        particles: {
          number: { value: 100, density: { enable: true, value_area: 800 } },
          color: { value: '#00e0ff' },
          shape: { type: 'circle' },
          opacity: { value: 0.5, random: true },
          size: { value: 3, random: true },
          line_linked: { enable: true, distance: 150, color: '#00e0ff', opacity: 0.4, width: 1 },
          move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false },
        },
        interactivity: {
          detect_on: 'canvas',
          events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
          modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } },
        },
        retina_detect: true,
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section className="particulas-section">
      <div id="particles-js" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></div>
      <div className="particulas-container">
        <h1>Experiencia Visual</h1>
        <p>Explora efectos de partículas interactivas.</p>
      </div>
    </section>
  );
};

export default Particulas;
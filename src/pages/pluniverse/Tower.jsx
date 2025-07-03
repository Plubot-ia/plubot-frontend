import { Particles } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { gsap } from 'gsap';
import { useEffect, useCallback } from 'react';

import ByteGuide from '@components/pluniverse/ByteGuide.jsx';

import './Tower.css';

const Tower = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: '#00e0ff' },
      shape: { type: 'circle' },
      opacity: { value: 0.5, random: true },
      size: { value: 3, random: true },
      line_linked: {
        enable: true,
        distance: 150,
        color: '#00e0ff',
        opacity: 0.4,
        width: 1,
      },
      move: {
        enable: true,
        speed: 2,
        direction: 'none',
        random: false,
        straight: false,
        out_mode: 'out',
        bounce: false,
      },
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: { enable: true, mode: 'repulse' },
        onclick: { enable: true, mode: 'push' },
        resize: true,
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
        push: { particles_nb: 4 },
      },
    },
    retina_detect: true,
    fullScreen: {
      enable: true,
      zIndex: -1,
    },
    background: {
      color: 'transparent',
    },
  };

  useEffect(() => {
    // Animaciones con GSAP
    gsap.from('.tower-title', {
      opacity: 0,
      y: 50,
      duration: 1.5,
      ease: 'power3.out',
    });
    gsap.from('.tower-subtitle', {
      opacity: 0,
      y: 30,
      duration: 1.5,
      ease: 'power3.out',
      delay: 0.3,
    });
    gsap.from('.gallery-item', {
      opacity: 0,
      y: 50,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      delay: 0.5,
    });
  }, []);

  const gallery = [
    { name: 'Plubot de Ventas', creator: 'Zentro', image: '/plubot-sales.jpg' },
    {
      name: 'Plubot de Soporte',
      creator: 'Nova',
      image: '/plubot-support.jpg',
    },
    {
      name: 'Plubot Creativo',
      creator: 'Kryon',
      image: '/plubot-creative.jpg',
    },
  ];

  return (
    <div className='tower'>
      <Particles
        id='tower-particles'
        init={particlesInit}
        options={particlesOptions}
      />
      <div className='tower-content'>
        <h1 className='tower-title'>Torre de Creativos</h1>
        <p className='tower-subtitle'>
          Inspírate con los mejores Plubots y plantillas creadas por otros
          estrategas del Pluniverse.
        </p>
        <div className='gallery-grid'>
          {gallery.map((item, index) => (
            <div className='gallery-item' key={item.name}>
              <img src={item.image} alt={item.name} className='gallery-image' />
              <h3>{item.name}</h3>
              <p>Creado por: {item.creator}</p>
              <button className='gallery-btn'>Explorar</button>
            </div>
          ))}
        </div>
      </div>
      <ByteGuide message='¡Mira qué creaciones tan increíbles! Puedes explorar y aprender de los mejores Plubots aquí.' />
    </div>
  );
};

export default Tower;

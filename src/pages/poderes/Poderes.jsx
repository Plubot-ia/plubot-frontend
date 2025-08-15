import { Particles } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Poderes.css';

import PoderesGrid from './PoderesGrid';

const particlesOptions = {
  particles: {
    number: { value: 60, density: { enable: true, value_area: 800 } },
    color: { value: '#00e0ff' },
    shape: { type: 'circle' },
    opacity: { value: 0.4, random: true },
    size: { value: 3, random: true },
    line_linked: {
      enable: true,
      distance: 150,
      color: '#00e0ff',
      opacity: 0.3,
      width: 1,
    },
    move: {
      enable: true,
      speed: 1.5,
      direction: 'none',
      random: false,
      straight: false,
      out_mode: 'out',
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
  background: { color: 'transparent' },
  fullScreen: { enable: false, zIndex: -1 },
};

const ParticlesBackground = React.memo(() => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);
  return (
    <Particles
      id='poderes-particles'
      className='particles-container'
      init={particlesInit}
      options={particlesOptions}
    />
  );
});
ParticlesBackground.displayName = 'ParticlesBackground';

const HeroSection = () => (
  <section className='poderes-hero'>
    <motion.h1
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2 }}
    >
      Desata los Poderes del Plubot
    </motion.h1>
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay: 0.3 }}
    >
      En el Pluniverse, tu Plubot es una fuerza cósmica. Activa sus poderes y domina el universo
      digital.
    </motion.p>
  </section>
);

const AboutSection = () => (
  <section className='poderes-about'>
    <motion.h2
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      ¿Qué son los Poderes del Plubot?
    </motion.h2>
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.7 }}
    >
      Los poderes son habilidades únicas que transforman a tu Plubot en un aliado imparable. Desde
      automatizaciones inteligentes hasta integraciones con herramientas como Shopify, Stripe, y
      MercadoPago, cada poder desbloquea nuevas posibilidades para tu negocio, haciéndolo más ágil,
      eficiente y conectado.
    </motion.p>
    <div className='hero-buttons'>
      <Link to='/poderes-about' className='hero-button'>
        Dime Más
      </Link>
      <Link to='/marketplace' className='hero-button secondary'>
        Explorar Poderes
      </Link>
    </div>
  </section>
);

const ProgressSection = ({ progress }) => (
  <section className='poderes-progress'>
    <h2>Progreso de Desbloqueo</h2>
    <div className='progress-bar-container'>
      <motion.div
        className='progress-bar'
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
      <span className='progress-text'>{progress}%</span>
    </div>
  </section>
);

ProgressSection.propTypes = {
  progress: PropTypes.number.isRequired,
};

const CtaSection = () => (
  <section className='poderes-cta'>
    <h2>Forja un Plubot Épico</h2>
    <p>Desbloquea poderes y crea un asistente que conquiste el Pluniverse.</p>
    <Link to='/welcome' className='hero-button'>
      Crear mi Plubot
    </Link>
  </section>
);

const Poderes = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((previous) => {
        if (previous >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return previous + 10;
      });
    }, 200);
    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className='poderes-page'>
      <ParticlesBackground />
      <HeroSection />
      <AboutSection />
      <ProgressSection progress={progress} />
      <PoderesGrid />
      <CtaSection />
    </div>
  );
};

export default Poderes;

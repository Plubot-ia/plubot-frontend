import { Particles } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { motion } from 'framer-motion';
import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';

import powersHeroImage from '@assets/img/poderes-hero.webp';

import './Poderes-about.css';

const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

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
    background: {
      color: 'transparent',
    },
    fullScreen: {
      enable: false,
      zIndex: -1,
    },
  };

  return (
    <Particles
      id='poderes-about-particles'
      className='particles-container'
      init={particlesInit}
      options={particlesOptions}
    />
  );
};

const HeroSection = () => (
  <section className='poderes-about-hero'>
    <motion.h1
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2 }}
    >
      ¿Qué son los Poderes del Plubot?
    </motion.h1>
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay: 0.3 }}
    >
      Descubre las habilidades cósmicas que transforman a tu Plubot en un aliado digital imparable,
      diseñado para llevar tu negocio a nuevas galaxias.
    </motion.p>
    <img
      src={powersHeroImage}
      alt='Plubot Powers'
      className='hero-image'
      onError={(event) => {
        event.target.src = 'https://via.placeholder.com/800x400?text=Image+Not+Found';
      }}
    />
  </section>
);

const ContentSection = () => (
  <section className='poderes-about-content'>
    <motion.div
      className='content-section'
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <h2>El Corazón del Pluniverse</h2>
      <p>
        Los poderes del Plubot son habilidades avanzadas que desbloquean el verdadero potencial de
        tu asistente digital. Cada poder es una herramienta única, desde automatizaciones
        inteligentes hasta integraciones con plataformas líderes como WhatsApp, Shopify, y Stripe.
        Estos poderes permiten a tu Plubot responder, organizar, y optimizar tu negocio como nunca
        antes.
      </p>
    </motion.div>

    <motion.div
      className='content-section'
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.7 }}
    >
      <h2>Por Qué los Poderes Cambian Todo</h2>
      <p>
        Imagina un asistente que no solo responde consultas, sino que también gestiona pagos, agenda
        citas, y personaliza su tono para reflejar tu marca. Los poderes hacen esto posible,
        transformando tareas rutinarias en flujos automatizados y experiencias memorables para tus
        clientes. Con cada poder activado, tu Plubot se vuelve más sabio y poderoso.
      </p>
    </motion.div>

    <motion.div
      className='content-section'
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.9 }}
    >
      <h2>Ejemplos de Poderes en Acción</h2>
      <ul>
        <li>
          <strong>Conexión a WhatsApp:</strong> Responde a clientes en tiempo real, envía
          notificaciones y cierra ventas directamente en WhatsApp.
        </li>
        <li>
          <strong>Poder de Shopify:</strong> Sincroniza pedidos y ofrece soporte automatizado en tu
          tienda online.
        </li>
        <li>
          <strong>Flujos Inteligentes:</strong> Crea automatizaciones que segmentan leads y
          resuelven consultas sin intervención humana.
        </li>
      </ul>
    </motion.div>
  </section>
);

const CallToActionSection = () => (
  <section className='poderes-about-cta'>
    <motion.h2
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1.1 }}
    >
      ¡Desata el Potencial de tu Plubot!
    </motion.h2>
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1.3 }}
    >
      Explora el Mercado de Extensiones y comienza a activar los poderes que llevarán tu negocio al
      siguiente nivel.
    </motion.p>
    <Link to='/pluniverse/marketplace' className='cta-button'>
      Explorar Poderes
    </Link>
  </section>
);

const PoderesAbout = () => (
  <div className='poderes-about-page'>
    <ParticlesBackground />
    <HeroSection />
    <ContentSection />
    <CallToActionSection />
  </div>
);

export default PoderesAbout;

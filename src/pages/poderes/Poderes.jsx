import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Poderes.css';

const Poderes = () => {
  const [selectedPower, setSelectedPower] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Particle background
    let script;
    if (window.particlesJS) {
      initParticles();
    } else {
      script = document.createElement('script');
      script.src = '/particles.min.js';
      script.async = true;
      document.body.appendChild(script);
      script.onload = initParticles;
      script.onerror = () => console.error('Error loading particles.min.js');
    }

    function initParticles() {
      const particleContainer = document.getElementById('poderes-particles');
      if (window.particlesJS && particleContainer) {
        window.particlesJS('poderes-particles', {
          particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: '#00e0ff' },
            shape: { type: 'circle' },
            opacity: { value: 0.4, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: '#00e0ff', opacity: 0.3, width: 1 },
            move: { enable: true, speed: 1.5, direction: 'none', random: false, straight: false, out_mode: 'out' },
          },
          interactivity: {
            detect_on: 'canvas',
            events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
            modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } },
          },
          retina_detect: true,
        });
      }
    }

    return () => {
      clearInterval(progressInterval);
      const loadedScript = document.querySelector('script[src="/particles.min.js"]');
      if (loadedScript) document.body.removeChild(loadedScript);
    };
  }, []);

  const powers = [
    {
      id: 1,
      title: 'Respuestas Ilimitadas',
      description: 'Atención sin límites para tus clientes, 24/7.',
      detailedDescription: 'Tu Plubot responde a un número infinito de consultas, ideal para negocios con alto volumen de interacciones.',
      icon: '🌌',
    },
    {
      id: 2,
      title: 'Conexión a WhatsApp',
      description: 'Mensajería instantánea en la app más usada.',
      detailedDescription: 'Integra WhatsApp Business API para soporte instantáneo, notificaciones y ventas directas.',
      icon: '🟢',
    },
    {
      id: 3,
      title: 'Integraciones Épicas',
      description: 'Conecta con Shopify, Stripe, Calendly, y más.',
      detailedDescription: 'Unifica tu flujo de trabajo con integraciones que potencian e-commerce, pagos y reservas.',
      icon: '🔗',
    },
    {
      id: 4,
      title: 'Flujos Inteligentes',
      description: 'Automatizaciones que resuelven solas.',
      detailedDescription: 'Crea flujos que segmentan leads, responden consultas y optimizan procesos automáticamente.',
      icon: '🧠',
    },
    {
      id: 5,
      title: 'Personalidad Evolutiva',
      description: 'Un Plubot con estilo propio que evoluciona.',
      detailedDescription: 'Personaliza el tono de tu Plubot; aprende y se adapta con cada interacción.',
      icon: '🌟',
    },
    {
      id: 6,
      title: 'Poder de Shopify',
      description: 'Automatiza tu tienda online con precisión.',
      detailedDescription: 'Sincroniza pedidos, gestiona inventarios y ofrece soporte en tiempo real con la integración de Shopify, potenciando tu e-commerce.',
      icon: '🛒',
    },
    {
      id: 7,
      title: 'Poder de Stripe',
      description: 'Pagos rápidos y seguros en un clic.',
      detailedDescription: 'Procesa pagos, envía facturas y gestiona reembolsos automáticamente con Stripe, haciendo que las transacciones sean fluidas y confiables.',
      icon: '💳',
    },
    {
      id: 8,
      title: 'Poder de Calendly',
      description: 'Reservas sin esfuerzo, siempre organizadas.',
      detailedDescription: 'Permite a tus clientes agendar citas directamente desde WhatsApp o tu sitio web con Calendly, sincronizando todo en tiempo real.',
      icon: '📅',
    },
    {
      id: 9,
      title: 'Poder de MercadoPago',
      description: 'Pagos fluidos para América Latina.',
      detailedDescription: 'Integra MercadoPago para procesar pagos, gestionar cuotas y ofrecer checkout personalizado, optimizando transacciones en la región.',
      icon: '💸',
    },
  ];

  return (
    <div className="poderes-page">
      <div id="poderes-particles" className="particles-container" />
      <section className="poderes-hero">
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
          En el Pluniverse, tu Plubot es una fuerza cósmica. Activa sus poderes y domina el universo digital.
        </motion.p>
      </section>

      <section className="poderes-about">
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
          Los poderes son habilidades únicas que transforman a tu Plubot en un aliado imparable. Desde automatizaciones inteligentes hasta integraciones con herramientas como Shopify, Stripe, y MercadoPago, cada poder desbloquea nuevas posibilidades para tu negocio, haciéndolo más ágil, eficiente y conectado.
        </motion.p>
        <div className="hero-buttons">
          <Link to="/poderes-about" className="hero-button">
            Dime Más
          </Link>
          <Link to="/pluniverse/marketplace" className="hero-button secondary">
            Explorar Poderes
          </Link>
        </div>
      </section>

      <section className="poderes-progress">
        <h2>Progreso de Desbloqueo</h2>
        <div className="progress-bar-container">
          <motion.div
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
          <span className="progress-text">{progress}%</span>
        </div>
      </section>

      <section className="poderes-grid">
        {powers.map((power) => (
          <motion.div
            key={power.id}
            className="power-card"
            onClick={() => setSelectedPower(power)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: power.id * 0.2 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 224, 255, 0.7)' }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="power-icon">{power.icon}</div>
            <h3>{power.title}</h3>
            <p>{power.description}</p>
          </motion.div>
        ))}
      </section>

      <section className="poderes-cta">
        <h2>Forja un Plubot Épico</h2>
        <p>Desbloquea poderes y crea un asistente que conquiste el Pluniverse.</p>
        <Link to="/plubot/create" className="hero-button">
          Crear mi Plubot
        </Link>
      </section>

      {selectedPower && (
        <div className="power-modal-overlay" onClick={() => setSelectedPower(null)}>
          <motion.div
            className="power-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <button className="close-modal-btn" onClick={() => setSelectedPower(null)}>×</button>
            <div className="modal-icon">{selectedPower.icon}</div>
            <h2>{selectedPower.title}</h2>
            <p>{selectedPower.detailedDescription}</p>
            <Link to="/pluniverse/marketplace" className="modal-button">
              Desbloquear Poder
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Poderes;
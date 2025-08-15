import Particles from '@tsparticles/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import plubotImage from '@/assets/img/plubot.svg';

import usePlubotCreation from '../../../hooks/usePlubotCreation';

import './FactoryScreen.css';

// Helper para configuración de partículas
function _getParticlesConfig() {
  return {
    fullScreen: { enable: true },
    background: {
      color: {
        value: '#000',
      },
    },
    particles: {
      number: { value: 80 },
      color: { value: ['#00e0ff', '#ff00ff'] },
      shape: { type: 'circle' },
      opacity: { value: 0.4, random: true },
      size: { value: { min: 1, max: 5 }, random: true },
      move: {
        enable: true,
        speed: 1,
        direction: 'none',
        outModes: 'out',
      },
      links: {
        enable: true,
        distance: { min: 100, max: 200 },
        color: '#00e0ff',
        opacity: 0.2,
        width: 1,
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          particles: {
            number: { value: 40 },
            size: { value: { min: 0.5, max: 3 } },
            links: { distance: { min: 50, max: 100 } },
          },
        },
      },
    ],
  };
}

// Helper para renderizar grid cósmico
function _renderCosmicGrid() {
  return (
    <div className='cosmic-grid'>
      {Array.from({ length: 20 }).map((_, index) => (
        <div
          key={`grid-line-${index + 1}`}
          className='grid-line'
          style={{ top: `${5 * (index + 1)}%` }}
        />
      ))}
    </div>
  );
}

// Helper para renderizar sección Plubot
function _renderPlubotSection(currentMessage) {
  return (
    <motion.div
      className='plubot-section'
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <motion.div
        className='plubot-hologram'
        animate={{
          y: [0, -10, 0],
          rotateY: [0, 5, 0, -5, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: 'easeInOut',
        }}
      >
        <div className='hologram-circles'>
          <div className='hologram-circle circle1' />
          <div className='hologram-circle circle2' />
          <div className='hologram-circle circle3' />
        </div>
        <motion.img
          src={plubotImage}
          alt='Plubot'
          className='plubot-image'
          style={{ width: '100%', height: '100%' }}
        />
      </motion.div>

      <motion.div className='message-box'>
        <div className='message-header'>
          <div className='message-dots'>
            <div className='message-dot' />
            <div className='message-dot' />
            <div className='message-dot' />
          </div>
          <div className='message-title'>PLUBOT v1.0</div>
        </div>
        <div className='message-content'>
          <span className='cursor'>&gt;</span> {currentMessage}
          <span className='blink'>_</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper para renderizar feature card individual
function _renderFeatureCard(iconClass, name) {
  return (
    <motion.div
      className='feature-card'
      whileHover={{
        scale: 1.05,
        boxShadow: '0 0 15px rgba(0, 224, 255, 0.8)',
      }}
    >
      <div className={`feature-icon ${iconClass}`} />
      <div className='feature-name'>{name}</div>
    </motion.div>
  );
}

// Helper para renderizar panel de creación
function _renderCreationPanel(handleNext) {
  return (
    <motion.div
      className='creation-panel'
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.8 }}
    >
      <h1 className='panel-title'>Fábrica de Bots</h1>
      <div className='panel-description'>
        Diseña y crea tu asistente digital personalizado que trabajará contigo y para ti.
      </div>

      <div className='feature-cards'>
        {_renderFeatureCard('personality', 'Personalidad')}
        {_renderFeatureCard('skills', 'Habilidades')}
      </div>

      <motion.button
        className='create-button'
        onClick={handleNext}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className='button-glow' />
        Comenzar Creación
      </motion.button>
    </motion.div>
  );
}

// Se mueve el array de mensajes fuera del componente para evitar que se recree en cada render.
const MESSAGES = [
  '¡Hola, Creador!',
  'Bienvenido a la Fábrica de Bots',
  'Es hora de crear tu asistente personal',
];

const particlesInit = async (engine) => {
  const { loadSlim } = await import('@tsparticles/slim');
  await loadSlim(engine);
};

const FactoryScreen = () => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const navigate = useNavigate();
  const { nextStep } = usePlubotCreation();

  // Efecto de typewriter para mensajes de Plubot
  useEffect(() => {
    // Si no está escribiendo, no se hace nada y se retorna para cumplir consistent-return.
    if (!isTyping) {
      return;
    }

    // Lógica para avanzar el texto del typewriter
    if (
      messageIndex >= 0 &&
      messageIndex < MESSAGES.length &&
      // eslint-disable-next-line security/detect-object-injection
      currentMessage.length < MESSAGES[messageIndex].length
    ) {
      const timeout = setTimeout(() => {
        setCurrentMessage(
          // eslint-disable-next-line security/detect-object-injection
          MESSAGES[messageIndex].slice(0, Math.max(0, currentMessage.length + 1)),
        );
      }, 50);
      return () => clearTimeout(timeout);
    }

    // Lógica para pasar al siguiente mensaje
    setIsTyping(false);
    const timeout = setTimeout(() => {
      if (messageIndex < MESSAGES.length - 1) {
        setMessageIndex(messageIndex + 1);
        setCurrentMessage('');
        setIsTyping(true);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [currentMessage, messageIndex, isTyping]);

  const handleNext = () => {
    nextStep();
    navigate('/personalization');
  };

  return (
    <div className='factory-screen'>
      <Particles id='tsparticles' init={particlesInit} options={_getParticlesConfig()} />

      {_renderCosmicGrid()}

      <motion.div
        className='factory-container'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        {_renderPlubotSection(currentMessage)}

        {_renderCreationPanel(handleNext)}
      </motion.div>
    </div>
  );
};

export default FactoryScreen;

import { motion, AnimatePresence } from 'framer-motion';
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';

import byteAvatar from '@assets/img/byte.png';

import useWindowSize from '../../hooks/useWindowSize';
import './TutorialesExpansion.css';

const TutorialesExpansion = () => {
  const { height } = useWindowSize();
  const [showMore, setShowMore] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [activatedElements, setActivatedElements] = useState([]);
  const containerReference = useRef(undefined);
  const audioReference = useRef(undefined);
  const navigate = useNavigate();

  const phrases = useMemo(
    () => [
      'Expande tu Plubot al siguiente nivel.',
      'Comparte tu visión en el PluBazaar.',
      'Haz crecer el Pluniverse con aliados.',
      'Compite en el Coliseo de Productividad.',
      'Desbloquea poderes premium para tu bot.',
    ],
    [],
  );

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState(phrases[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (phraseIndex + 1) % phrases.length;
      setPhraseIndex(nextIndex);
      setCurrentPhrase(phrases[nextIndex]);
    }, 4000);
    return () => clearInterval(interval);
  }, [phrases, phraseIndex]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (containerReference.current) {
        const rect = containerReference.current.getBoundingClientRect();
        setCursorPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    };
    globalThis.addEventListener('mousemove', handleMouseMove);
    return () => globalThis.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    audioReference.current = new Audio('/sounds/cyber-activation.mp3');
    return () => {
      if (audioReference.current) {
        audioReference.current.pause();
      }
    };
  }, []);

  const playActivationSound = () => {
    if (audioReference.current) {
      audioReference.current.currentTime = 0;
      audioReference.current.play();
    }
  };

  const activateElement = useCallback(
    (id) => {
      if (!activatedElements.includes(id)) {
        setActivatedElements((previous) => [...previous, id]);
        playActivationSound();
      }
    },
    [activatedElements],
  );

  const handleScroll = useCallback(() => {
    const elements = document.querySelectorAll('.activatable');
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top <= (height || 0) * 0.8 && rect.bottom >= 0;
      if (isVisible) {
        const { id } = element.dataset;
        if (id && !activatedElements.includes(id)) {
          activateElement(id);
        }
      }
    }
  }, [height, activatedElements, activateElement]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Llamada inicial
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const buttonVariants = {
    hover: { scale: 1.08, boxShadow: '0 0 20px rgba(255, 0, 255, 0.8)' },
    tap: { scale: 0.95 },
  };

  const expandableContentVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7 } },
    exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.5 } },
  };

  const renderByteContainer = () => (
    <motion.div
      className='byte-floating hologram-effect'
      animate={{
        y: [0, -15, 0],
        filter: [
          'drop-shadow(0 0 15px #00ffea)',
          'drop-shadow(0 0 25px #ff00ff)',
          'drop-shadow(0 0 15px #00ffea)',
        ],
      }}
      transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
    >
      <div className='avatar-container'>
        <img src={byteAvatar} alt='Byte el guía' className='byte-avatar' />
        <div className='ring ring1' />
        <div className='ring ring2' />
        <div className='ring ring3' />
      </div>

      <AnimatePresence mode='wait'>
        <motion.div
          key={phraseIndex}
          className='byte-dialog'
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.8 }}
        >
          <div className='dialog-corner tl' />
          <div className='dialog-corner tr' />
          <div className='dialog-corner bl' />
          <div className='dialog-corner br' />
          {currentPhrase}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );

  const renderCardsContainer = () => (
    <motion.div
      className='expansion-cards-container'
      initial='hidden'
      animate='visible'
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.2,
          },
        },
      }}
    >
      <motion.div
        className={`expansion-card activatable ${activatedElements.includes('plubazaar-card') ? 'activated' : ''}`}
        variants={expandableContentVariants}
        data-id='plubazaar-card'
      >
        <div className='expansion-card-icon'>💰</div>
        <h2 className='expansion-card-title'>PluBazaar</h2>
        <p className='expansion-card-description'>
          Compra y vende flujos, plantillas y módulos para tu Plubot.
        </p>
      </motion.div>

      <motion.div
        className={`expansion-card activatable ${activatedElements.includes('coliseum-card') ? 'activated' : ''}`}
        variants={expandableContentVariants}
        data-id='coliseum-card'
      >
        <div className='expansion-card-icon'>🏆</div>
        <h2 className='expansion-card-title'>Coliseo</h2>
        <p className='expansion-card-description'>
          Compite con otros creadores y gana recompensas únicas.
        </p>
      </motion.div>

      <motion.div
        className={`expansion-card activatable ${activatedElements.includes('premium-card') ? 'activated' : ''}`}
        variants={expandableContentVariants}
        data-id='premium-card'
      >
        <div className='expansion-card-icon'>✨</div>
        <h2 className='expansion-card-title'>Planes Premium</h2>
        <p className='expansion-card-description'>
          Desbloquea todo el potencial con capacidades avanzadas.
        </p>
      </motion.div>
    </motion.div>
  );

  const renderButtonContainer = () => (
    <motion.div className='expansion-button-container'>
      <motion.button
        className='cyberpunk-button show-more-button'
        onClick={() => setShowMore(!showMore)}
        variants={buttonVariants}
        whileHover='hover'
        whileTap='tap'
      >
        <span className='button-glow' />
        {showMore ? 'MOSTRAR MENOS' : 'MOSTRAR MÁS'}
        <div className='button-icon'>{showMore ? '▲' : '▼'}</div>
      </motion.button>
    </motion.div>
  );

  const renderExpandedContent = () => (
    <AnimatePresence>
      {showMore && (
        <motion.div
          className='expanded-content'
          initial='hidden'
          animate='visible'
          exit='exit'
          variants={expandableContentVariants}
        >
          <div className='terminal-container'>
            <div className='terminal-header'>
              <div className='terminal-title'>EXPANSION.PROTOCOL</div>
              <div className='terminal-controls'>
                <span />
                <span />
                <span />
              </div>
            </div>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>
                {'>'} Explorando nuevos poderes...
              </span>
              Encuentra módulos y plantillas en el PluBazaar para potenciar tu
              Plubot.
            </motion.p>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>
                {'>'} Compartiendo en PluBazaar...
              </span>
              Vende tus flujos y plantillas, gana PluCoins y construye tu
              reputación.
            </motion.p>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>{'>'} Escalando tu negocio...</span>
              Expande las capacidades de tu Plubot para gestionar más clientes y
              procesos.
            </motion.p>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>
                {'>'} Compitiendo en el Coliseo...
              </span>
              Mide la eficiencia de tu Plubot y gana recompensas para tu
              expansión.
            </motion.p>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>{'>'} Navegando el PluBazaar...</span>
              Compra poderes con PluCoins o adquiere módulos premium para tu
              Plubot.
            </motion.p>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>{'>'} Vendiendo creaciones...</span>
              Sube flujos al PluBazaar y genera ingresos pasivos con tus
              creaciones.
            </motion.p>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>
                {'>'} Escalando con planes Pro...
              </span>
              Gestiona equipos y optimiza resultados con múltiples Plubots.
            </motion.p>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>{'>'} Desafíos en el Coliseo...</span>
              Compite, gana medallas y usa tus recompensas para nuevos poderes.
            </motion.p>

            <motion.div
              className='expansion-cta'
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <motion.button
                className='cyberpunk-button cta-button'
                variants={buttonVariants}
                whileHover='hover'
                whileTap='tap'
                onClick={() => {
                  navigate('/pluniverse/marketplace');
                  playActivationSound();
                }}
              >
                <span className='button-glow' />
                VISITA EL PLUBAZAAR
                <div className='button-icon'>▶</div>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className='tutoriales-page about-wrapper' ref={containerReference}>
      <div className='scanner-line' />
      <div className='about-container'>
        <motion.h1
          className='glitch-title cyberpunk-text'
          data-text='EXPANSIÓN PLUBOT'
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
        >
          <span className='cyber-bracket'>[</span>
          EXPANSIÓN PLUBOT
          <span className='cyber-bracket'>]</span>
        </motion.h1>

        <motion.div
          className='digital-badge'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          SISTEMA DE MÓDULOS v1.2
        </motion.div>

        <motion.div className='about-card glass holographic-card'>
          <div className='card-corner top-left' />
          <div className='card-corner top-right' />
          <div className='card-corner bottom-left' />
          <div className='card-corner bottom-right' />

          {renderByteContainer()}

          <p className='tutorials-expansion-description'>
            Lleva tu Plubot al siguiente nivel con nuevas capacidades.
          </p>

          {renderCardsContainer()}
          {renderButtonContainer()}
          {renderExpandedContent()}
        </motion.div>

        <div className='interface-elements'>
          <div className='interface-dot' />
          <div className='interface-dot' />
          <div className='interface-dot' />
        </div>
      </div>

      <div
        className='digital-cursor'
        style={{
          left: cursorPosition.x,
          top: cursorPosition.y,
          opacity: 1, // Mantener visible mientras el cursor está en la ventana
        }}
      />
    </div>
  );
};

export default TutorialesExpansion;

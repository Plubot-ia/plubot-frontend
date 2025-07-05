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
  const [isHovering, setIsHovering] = useState(false);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((previous) => (previous + 1) % phrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [phrases]);

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

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const calculateTilt = () => {
    if (!containerReference.current || !isHovering) return { x: 0, y: 0 };
    const rect = containerReference.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((cursorPosition.y - centerY) / centerY) * 5;
    const tiltY = ((cursorPosition.x - centerX) / centerX) * -5;
    return { x: tiltX, y: tiltY };
  };

  const tilt = calculateTilt();

  const buttonVariants = {
    hover: { scale: 1.08, boxShadow: '0 0 20px rgba(255, 0, 255, 0.8)' },
    tap: { scale: 0.95 },
  };

  const expandableContentVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7 } },
    exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.5 } },
  };

  const renderHeader = () => (
    <div className='tutorials-expansion-header'>
      <h1 className='tutorials-expansion-title'>
        EXPANSIÓN <span className='highlight'>PLUBOT</span>
      </h1>
      <p className='tutorials-expansion-description'>
        Lleva tu Plubot al siguiente nivel con nuevas capacidades.
      </p>
    </div>
  );

  const renderByteContainer = () => (
    <div className='expansion-byte-container'>
      <motion.div
        className='byte-avatar-container'
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
          scale: isHovering ? 1.1 : 1,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <img src={byteAvatar} alt='Byte' className='byte-avatar' />
        <div className='byte-glow' />
      </motion.div>

      <motion.div
        className='byte-speech-bubble'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <AnimatePresence mode='wait'>
          <motion.span
            key={phraseIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {phrases[phraseIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
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
              Encuentra módulos y plantillas en el PluBazaar para potenciar
              tu Plubot.
            </motion.p>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>
                {'>'} Compartiendo en PluBazaar...
              </span>
              Vende tus flujos y plantillas, gana PluCoins y construye tu
              reputación.
            </motion.p>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>
                {'>'} Escalando tu negocio...
              </span>
              Usa múltiples Plubots para gestionar equipos y atender
              clientes globales.
            </motion.p>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>
                {'>'} Compitiendo en el Coliseo...
              </span>
              Mide la eficiencia de tu Plubot y gana recompensas para tu
              expansión.
            </motion.p>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>
                {'>'} Navegando el PluBazaar...
              </span>
              Compra poderes con PluCoins o adquiere módulos premium para tu
              Plubot.
            </motion.p>

            <motion.p className='expansion-text terminal-text'>
              <span className='code-line'>
                {'>'} Vendiendo creaciones...
              </span>
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
              <span className='code-line'>
                {'>'} Desafíos en el Coliseo...
              </span>
              Compite, gana medallas y usa tus recompensas para nuevos
              poderes.
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

  const renderMainContent = () => (
    <div
      className='tutorials-expansion-container'
      ref={containerReference}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderHeader()}
      {renderByteContainer()}
      {renderCardsContainer()}
      {renderButtonContainer()}
      {renderExpandedContent()}
      <div className='interface-elements'>
        <div className='interface-dot' />
        <div className='interface-dot' />
        <div className='interface-dot' />
      </div>
    </div>
  );

  return renderMainContent();
};

export default TutorialesExpansion;

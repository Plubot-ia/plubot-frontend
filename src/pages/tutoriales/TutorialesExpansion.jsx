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
  const containerReference = useRef(null);
  const audioReference = useRef(null);
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

  return (
    <div
      className='tutoriales-expansion-page expansion-wrapper'
      ref={containerReference}
    >
      <div className='scanner-line' />
      <div
        className='digital-cursor'
        style={{
          left: cursorPosition.x,
          top: cursorPosition.y,
          opacity: isHovering ? 1 : 0,
        }}
      />
      <div className='expansion-container'>
        <motion.h1
          className='glitch-title cyberpunk-text'
          data-text='EXPANSIÓN EN EL PLUNIVERSE'
          initial={{ opacity: 0, y: -60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
        >
          <span className='cyber-bracket'>[</span>
          EXPANSIÓN EN EL PLUNIVERSE
          <span className='cyber-bracket'>]</span>
        </motion.h1>

        <motion.div
          className='byte-section glass holographic-card'
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 1.2 }}
          style={{
            transform: isHovering
              ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
              : 'perspective(1000px) rotateX(0) rotateY(0)',
            transition: 'transform 0.5s ease-out',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className='card-corner top-left' />
          <div className='card-corner top-right' />
          <div className='card-corner bottom-left' />
          <div className='card-corner bottom-right' />

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
              <img src={byteAvatar} alt='Byte' className='byte-avatar' />
              <div className='avatar-rings'>
                <div className='ring ring1' />
                <div className='ring ring2' />
                <div className='ring ring3' />
              </div>
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
                {/* eslint-disable-next-line security/detect-object-injection */}
                {phrases[phraseIndex]}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div className='data-metrics'>
            <div className='metric'>
              <span className='metric-label'>PLUNIVERSE</span>
              <span className='metric-value'>ONLINE</span>
            </div>
            <div className='metric'>
              <span className='metric-label'>PLUBAZAAR</span>
              <span className='metric-value'>ACTIVE</span>
            </div>
            <div className='metric'>
              <span className='metric-label'>BYTE-STATUS</span>
              <span className='metric-value'>OPERATIONAL</span>
            </div>
          </div>

          <motion.p
            className='expansion-text activatable'
            data-id='text1'
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            En el <strong className='highlight-text'>Pluniverse</strong>, la
            expansión es ilimitada.
          </motion.p>

          <motion.p
            className='expansion-text activatable'
            data-id='text2'
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Potencia tu Plubot, comparte creaciones y escala tu negocio con
            aliados digitales.
          </motion.p>

          <motion.button
            className='expansion-toggle cyberpunk-button'
            variants={buttonVariants}
            whileHover='hover'
            whileTap='tap'
            onClick={() => {
              setShowMore((previous) => !previous);
              playActivationSound();
            }}
          >
            <span className='button-glow' />
            <span className='button-text'>
              {showMore ? 'CERRAR DATOS' : 'ACTIVAR DATOS'}
            </span>
            <div className='button-icon'>{showMore ? '×' : '▶'}</div>
          </motion.button>

          <AnimatePresence>
            {showMore && (
              <motion.div
                className='expansion-story'
                variants={expandableContentVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
              >
                <div className='terminal-header'>
                  <div className='terminal-icon' />
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className='interface-elements'>
          <div className='interface-dot' />
          <div className='interface-dot' />
          <div className='interface-dot' />
        </div>
      </div>
    </div>
  );
};

export default TutorialesExpansion;

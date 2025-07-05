import { motion, AnimatePresence } from 'framer-motion';
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';

import byteAvatar from '@assets/img/byte.png';

import useWindowSize from '../../hooks/useWindowSize';

import './TutorialesAprendizaje.css';

const TutorialesAprendizaje = () => {
  const { height } = useWindowSize();
  const [showMore, setShowMore] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [activatedElements, setActivatedElements] = useState([]);
  const containerReference = useRef(undefined);
  const audioReference = useRef(undefined);

  const phrases = useMemo(
    () => [
      'En el Pluniverse, aprender es evolucionar.',
      'Entrena a tu Plubot y crece con él.',
      'Descubre la Academia de Automatización.',
      'Conecta con la comunidad en el PluForum.',
      'Obtén certificaciones y destaca.',
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

  const playActivationSound = useCallback(() => {
    if (audioReference.current) {
      audioReference.current.currentTime = 0;
      audioReference.current.play();
    }
  }, []);

  const activateElement = useCallback(
    (id) => {
      if (!activatedElements.includes(id)) {
        setActivatedElements((previous) => [...previous, id]);
        playActivationSound();
      }
    },
    [activatedElements, playActivationSound],
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

  const tilt = useMemo(() => {
    if (!containerReference.current || !isHovering) return { x: 0, y: 0 };
    const rect = containerReference.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((cursorPosition.y - centerY) / centerY) * 5;
    const tiltY = ((cursorPosition.x - centerX) / centerX) * -5;
    return { x: tiltX, y: tiltY };
  }, [cursorPosition, isHovering]);

  const cardStyle = useMemo(
    () => ({
      transform: isHovering
        ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
        : 'perspective(1000px) rotateX(0) rotateY(0)',
      transition: 'transform 0.5s ease-out',
    }),
    [isHovering, tilt],
  );

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
      className='tutoriales-aprendizaje-page aprendizaje-wrapper'
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
      <div className='aprendizaje-container'>
        <motion.h1
          className='glitch-title cyberpunk-text'
          data-text='APRENDIZAJE EN EL PLUNIVERSE'
          initial={{ opacity: 0, y: -60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
        >
          <span className='cyber-bracket'>[</span>
          APRENDIZAJE EN EL PLUNIVERSE
          <span className='cyber-bracket'>]</span>
        </motion.h1>

        <motion.div
          className='byte-section glass holographic-card'
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 1.2 }}
          style={cardStyle}
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
              <span className='metric-label'>ACADEMY</span>
              <span className='metric-value'>ACTIVE</span>
            </div>
            <div className='metric'>
              <span className='metric-label'>BYTE-STATUS</span>
              <span className='metric-value'>OPERATIONAL</span>
            </div>
          </div>

          <motion.p
            className='aprendizaje-text activatable'
            data-id='text1'
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            La{' '}
            <strong className='highlight-text'>
              Academia de Automatización
            </strong>{' '}
            es el corazón del aprendizaje en el Pluniverse. Aquí, tú y tu Plubot
            evolucionan juntos.
          </motion.p>

          <motion.p
            className='aprendizaje-text activatable'
            data-id='text2'
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Descubre cómo entrenar a tu Plubot, aprovechar recursos y
            convertirte en un Arquitecto del Pluniverse.
          </motion.p>

          <motion.button
            className='aprendizaje-toggle cyberpunk-button'
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
                className='aprendizaje-story'
                variants={expandableContentVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
              >
                <div className='terminal-header'>
                  <div className='terminal-icon' />
                  <div className='terminal-title'>LEARNING.PROTOCOL</div>
                  <div className='terminal-controls'>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <motion.p className='aprendizaje-text terminal-text'>
                  <span className='code-line'>
                    {'>'} Iniciando protocolo de aprendizaje...
                  </span>
                  La Academia te guía para entrenar a tu Plubot con nuevas
                  habilidades.
                </motion.p>

                <motion.p className='aprendizaje-text terminal-text'>
                  <span className='code-line'>
                    {'>'} Cargando tutoriales interactivos...
                  </span>
                  Explora cursos en video y guías paso a paso para dominar
                  flujos e integraciones.
                </motion.p>

                <motion.p className='aprendizaje-text terminal-text'>
                  <span className='code-line'>
                    {'>'} Conectando con la comunidad...
                  </span>
                  Únete al PluForum para compartir ideas, resolver dudas y
                  descubrir hacks.
                </motion.p>

                <motion.p className='aprendizaje-text terminal-text'>
                  <span className='code-line'>
                    {'>'} Desbloqueando certificaciones...
                  </span>
                  Obtén credenciales como “Constructor de Flujos” para destacar
                  en el Pluniverse.
                </motion.p>

                <motion.div
                  className='aprendizaje-cta'
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
                      globalThis.location.href = '/pluniverse/academy';
                      playActivationSound();
                    }}
                  >
                    <span className='button-glow' />
                    EXPLORA LA ACADEMIA
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

export default TutorialesAprendizaje;

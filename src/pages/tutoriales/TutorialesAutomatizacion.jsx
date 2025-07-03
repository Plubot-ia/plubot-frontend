import { motion, AnimatePresence } from 'framer-motion';
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { Link } from 'react-router-dom';

import byteAvatar from '@assets/img/byte.png';

import useWindowSize from '../../hooks/useWindowSize';

import './TutorialesAutomatizacion.css';

const TutorialesAutomatizacion = () => {
  const { height } = useWindowSize();
  const [showMore, setShowMore] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [activatedElements, setActivatedElements] = useState([]);
  const containerReference = useRef(null);
  const audioReference = useRef(null);

  const phrases = useMemo(
    () => [
      'Automatiza y conquista el caos.',
      'Tu Plubot, tu flujo, tu poder.',
      'Eficiencia es el nuevo superpoder.',
      'Crea flujos que trabajan por ti.',
      'Byte te guía en cada paso.',
    ],
    [],
  );

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
      className='tutoriales-automatizacion-page automatizacion-wrapper'
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
      <div className='automatizacion-container'>
        <motion.h1
          className='glitch-title cyberpunk-text'
          data-text='AUTOMATIZACIÓN'
          initial={{ opacity: 0, y: -60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
        >
          <span className='cyber-bracket'>[</span>
          AUTOMATIZACIÓN
          <span className='cyber-bracket'>]</span>
        </motion.h1>

        <motion.div
          className='digital-badge'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          PROTOCOLO v3.0
        </motion.div>

        <motion.div
          className='automatizacion-card glass holographic-card'
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
              <img
                src={byteAvatar}
                alt='Byte el guía'
                className='byte-avatar'
              />
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
              <span className='metric-label'>AUTOMATION</span>
              <span className='metric-value'>ACTIVE</span>
            </div>
            <div className='metric'>
              <span className='metric-label'>BYTE-STATUS</span>
              <span className='metric-value'>OPERATIONAL</span>
            </div>
          </div>

          <motion.p
            className='automatizacion-text activatable'
            data-id='text1'
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            La <strong className='highlight-text'>automatización</strong> es el
            núcleo del Pluniverse. Convierte tareas repetitivas en flujos
            inteligentes.
          </motion.p>

          <motion.p
            className='automatizacion-text activatable'
            data-id='text2'
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Tu Plubot aprende de tus necesidades y optimiza procesos para
            maximizar tu eficiencia.
          </motion.p>

          <motion.button
            className='automatizacion-toggle cyberpunk-button'
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
              {showMore ? 'CERRAR PROTOCOLO' : 'INICIAR PROTOCOLO'}
            </span>
            <div className='button-icon'>{showMore ? '×' : '▶'}</div>
          </motion.button>

          <AnimatePresence>
            {showMore && (
              <motion.div
                className='automatizacion-story'
                variants={expandableContentVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
              >
                <div className='terminal-header'>
                  <div className='terminal-icon' />
                  <div className='terminal-title'>AUTOMATION.PROTOCOL</div>
                  <div className='terminal-controls'>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <motion.p className='automatizacion-text terminal-text'>
                  <span className='code-line'>
                    {'>'} Iniciando protocolo de automatización...
                  </span>
                  Byte te guía para crear flujos que eliminan el trabajo manual.
                </motion.p>

                <motion.p className='automatizacion-text terminal-text'>
                  <span className='code-line'>
                    {'>'} Analizando procesos...
                  </span>
                  Desde correos automáticos hasta integraciones complejas, tu
                  Plubot lo hace posible.
                </motion.p>

                <motion.div
                  className='automatizacion-cta'
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Link to='/welcome'>
                    <motion.button
                      className='cyberpunk-button cta-button'
                      variants={buttonVariants}
                      whileHover='hover'
                      whileTap='tap'
                      onClick={playActivationSound}
                    >
                      <span className='button-glow' />
                      COMENZAR AUTOMATIZACIÓN
                      <div className='button-icon'>▶</div>
                    </motion.button>
                  </Link>
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

export default TutorialesAutomatizacion;

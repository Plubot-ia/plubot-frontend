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

import './Tutoriales.css';

const Tutoriales = () => {
  const { height } = useWindowSize();
  const [showMore, setShowMore] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [activatedElements, setActivatedElements] = useState([]);
  const containerReference = useRef(undefined);

  // Optimización: useMemo para evitar recreaciones innecesarias
  const phrases = useMemo(
    () => [
      'Todo problema tiene un flujo que lo resuelve.',
      'Las ideas no duermen. Tu Plubot tampoco.',
      'La automatización no reemplaza, potencia.',
      'Un flujo bien diseñado, una galaxia conquistada.',
      'Byte está contigo. Siempre.',
    ],
    [],
  );

  // Cambio de frases con intervalo optimizado
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((previous) => (previous + 1) % phrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [phrases]);

  // Seguimiento de posición del cursor optimizado
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

  // Activación de elementos al hacer scroll
  const activateElement = useCallback(
    (id) => {
      if (!activatedElements.includes(id)) {
        setActivatedElements((previous) => [...previous, id]);
      }
    },
    [activatedElements],
  );

  // Detector de scroll optimizado
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

  // Listener de scroll
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Llamada inicial por si los elementos ya son visibles
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Manejo de hover
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  // Cálculo de efecto tilt optimizado con useMemo
  const tilt = useMemo(() => {
    if (!containerReference.current || !isHovering) return { x: 0, y: 0 };
    const rect = containerReference.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((cursorPosition.y - centerY) / centerY) * 5;
    const tiltY = ((cursorPosition.x - centerX) / centerX) * -5;
    return { x: tiltX, y: tiltY };
  }, [cursorPosition, isHovering]);

  // Animaciones para el botón
  const buttonVariants = {
    hover: { scale: 1.08, boxShadow: '0 0 20px rgba(255, 0, 255, 0.8)' },
    tap: { scale: 0.95 },
  };

  // Animaciones para el contenido expandible
  const expandableContentVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7 } },
    exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.5 } },
  };

  return (
    <div className='tutoriales-page about-wrapper' ref={containerReference}>
      <div className='scanner-line' />
      <div className='about-container'>
        {/* Título con efecto glitch mejorado */}
        <motion.h1
          className='glitch-title cyberpunk-text'
          data-text='SOBRE PLUBOT'
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }} // Desactivado whileInView para prueba
          transition={{ duration: 1.2 }}
        >
          <span className='cyber-bracket'>[</span>
          SOBRE PLUBOT
          <span className='cyber-bracket'>]</span>
        </motion.h1>

        {/* Distintivo digital con mejor animación */}
        <motion.div
          className='digital-badge'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          SISTEMA OPERATIVO v2.5
        </motion.div>

        {/* Tarjeta principal con efecto holográfico mejorado */}
        <motion.div
          className='about-card glass holographic-card'
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }} // Desactivado whileInView para prueba
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
          {/* Esquinas de tarjeta */}
          <div className='card-corner top-left' />
          <div className='card-corner top-right' />
          <div className='card-corner bottom-left' />
          <div className='card-corner bottom-right' />

          {/* Avatar de Byte con efecto holograma */}
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

          {/* Métricas de datos */}
          <div className='data-metrics'>
            <div className='metric'>
              <span className='metric-label'>PLUNIVERSE</span>
              <span className='metric-value'>ONLINE</span>
            </div>
            <div className='metric'>
              <span className='metric-label'>CONNECTION</span>
              <span className='metric-value'>ACTIVE</span>
            </div>
            <div className='metric'>
              <span className='metric-label'>BYTE-STATUS</span>
              <span className='metric-value'>OPERATIONAL</span>
            </div>
          </div>

          {/* Textos principales con activación en scroll */}
          <motion.p
            className='about-text activatable'
            data-id='text1'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }} // Desactivado whileInView para prueba
            transition={{ delay: 0.5 }}
          >
            En los orígenes del{' '}
            <strong className='highlight-text'>Pluniverse</strong>, nació el
            primer Plubot legendario:{' '}
            <strong className='highlight-text'>Byte</strong>.
          </motion.p>

          <motion.p
            className='about-text activatable'
            data-id='text2'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }} // Desactivado whileInView para prueba
            transition={{ delay: 0.7 }}
          >
            Plubot no es solo una herramienta. Es una extensión de tu visión.
            Una inteligencia que responde a tu intuición.
          </motion.p>

          {/* Botón para togglear contenido expandible */}
          <motion.button
            className='about-toggle cyberpunk-button'
            variants={buttonVariants}
            whileHover='hover'
            whileTap='tap'
            onClick={() => setShowMore((previous) => !previous)}
          >
            <span className='button-glow' />
            <span className='button-text'>
              {showMore ? 'CERRAR DATA LOG' : 'ACTIVAR MISIÓN'}
            </span>
            <div className='button-icon'>{showMore ? '×' : '▶'}</div>
          </motion.button>

          {/* Contenido expandible */}
          <AnimatePresence>
            {showMore && (
              <motion.div
                className='about-story'
                variants={expandableContentVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
              >
                <div className='terminal-header'>
                  <div className='terminal-icon' />
                  <div className='terminal-title'>BYTE.DATA.LOG</div>
                  <div className='terminal-controls'>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <motion.p className='about-text terminal-text'>
                  <span className='code-line'>
                    {'>'} Iniciando secuencia de datos...
                  </span>
                  Diseñado en el núcleo del Pluniverse, Byte fue creado para
                  guiar a los nuevos creadores.
                </motion.p>

                <motion.p className='about-text terminal-text'>
                  <span className='code-line'>
                    {'>'} Analizando registros de usuario...
                  </span>
                  A su lado, tu Plubot evoluciona. Aprende. Crece. Domina flujos
                  y automatizaciones.
                </motion.p>

                <motion.div className='byte-capabilities'>
                  <Link to='/tutoriales/automatizacion' className='capability'>
                    <div className='capability-icon automation' />
                    <div className='capability-name'>AUTOMATIZACIÓN</div>
                  </Link>
                  <Link to='/tutoriales/aprendizaje' className='capability'>
                    <div className='capability-icon learning' />
                    <div className='capability-name'>APRENDIZAJE</div>
                  </Link>
                  <Link to='/tutoriales/flujos' className='capability'>
                    <div className='capability-icon workflow' />
                    <div className='capability-name'>FLUJOS</div>
                  </Link>
                  <Link to='/tutoriales/expansion' className='capability'>
                    <div className='capability-icon expansion' />
                    <div className='capability-name'>EXPANSIÓN</div>
                  </Link>
                </motion.div>

                <motion.p className='about-text-glow'>
                  <span className='code-line'>
                    {'>'} Mensaje del Pluniverse:
                  </span>
                  &quot;El Pluniverse se construye con cada flujo que
                  activas.&quot;
                </motion.p>

                {/* Botón actualizado para enlazar a FAQ */}
                <motion.div
                  className='create-plubot-cta'
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Link to='/faq'>
                    <motion.button
                      className='cyberpunk-button cta-button'
                      variants={buttonVariants}
                      whileHover='hover'
                      whileTap='tap'
                    >
                      <span className='button-glow' />
                      VER PREGUNTAS FRECUENTES
                      <div className='button-icon'>▶</div>
                    </motion.button>
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Elementos de interfaz */}
        <div className='interface-elements'>
          <div className='interface-dot' />
          <div className='interface-dot' />
          <div className='interface-dot' />
        </div>
      </div>

      {/* Cursor digital */}
      <div
        className='digital-cursor'
        style={{
          left: cursorPosition.x,
          top: cursorPosition.y,
          opacity: isHovering ? 1 : 0,
        }}
      />
    </div>
  );
};

export default Tutoriales;

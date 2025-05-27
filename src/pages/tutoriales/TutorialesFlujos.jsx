import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import byteAvatar from '@assets/img/byte.png';
import './TutorialesFlujos.css';

const TutorialesFlujos = () => {
  const [showMore, setShowMore] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [activatedElements, setActivatedElements] = useState([]);
  const containerRef = useRef(null);
  const audioRef = useRef(null);

  const phrases = [
    "Los flujos son el alma de tu Plubot.",
    "Conecta nodos y activa poderes.",
    "Haz magia digital con automatizaciones.",
    "Explora el PluLab para crear flujos.",
    "Integra herramientas como WhatsApp."
  ];

  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCursorPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/cyber-activation.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const playActivationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const activateElement = (id) => {
    if (!activatedElements.includes(id)) {
      setActivatedElements((prev) => [...prev, id]);
      playActivationSound();
    }
  };

  const handleScroll = () => {
    const elements = document.querySelectorAll('.activatable');
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const isVisible =
        rect.top <= window.innerHeight * 0.8 && rect.bottom >= 0;
      if (isVisible) {
        const id = el.getAttribute('data-id');
        if (id && !activatedElements.includes(id)) {
          activateElement(id);
        }
      }
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activatedElements]);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const calculateTilt = () => {
    if (!containerRef.current || !isHovering) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((cursorPosition.y - centerY) / centerY) * 5;
    const tiltY = ((cursorPosition.x - centerX) / centerX) * -5;
    return { x: tiltX, y: tiltY };
  };

  const tilt = calculateTilt();

  const buttonVariants = {
    hover: { scale: 1.08, boxShadow: '0 0 20px rgba(255, 0, 255, 0.8)' },
    tap: { scale: 0.95 }
  };

  const expandableContentVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7 } },
    exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.5 } }
  };

  return (
    <div className="tutoriales-flujos-page flujos-wrapper" ref={containerRef}>
      <div className="scanner-line" />
      <div
        className="digital-cursor"
        style={{
          left: cursorPosition.x,
          top: cursorPosition.y,
          opacity: isHovering ? 1 : 0,
        }}
      />
      <div className="flujos-container">
        <motion.h1
          className="glitch-title cyberpunk-text"
          data-text="FLUJOS EN EL PLUNIVERSE"
          initial={{ opacity: 0, y: -60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
        >
          <span className="cyber-bracket">[</span>
          FLUJOS EN EL PLUNIVERSE
          <span className="cyber-bracket">]</span>
        </motion.h1>

        <motion.div
          className="byte-section glass holographic-card"
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
          <div className="card-corner top-left"></div>
          <div className="card-corner top-right"></div>
          <div className="card-corner bottom-left"></div>
          <div className="card-corner bottom-right"></div>

          <motion.div
            className="byte-floating hologram-effect"
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
            <div className="avatar-container">
              <img src={byteAvatar} alt="Byte" className="byte-avatar" style={{ objectFit: 'contain' }} />
              <div className="avatar-rings">
                <div className="ring ring1"></div>
                <div className="ring ring2"></div>
                <div className="ring ring3"></div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={phraseIndex}
                className="byte-dialog"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.8 }}
              >
                <div className="dialog-corner tl"></div>
                <div className="dialog-corner tr"></div>
                <div className="dialog-corner bl"></div>
                <div className="dialog-corner br"></div>
                {phrases[phraseIndex]}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div className="data-metrics">
            <div className="metric">
              <span className="metric-label">PLUNIVERSE</span>
              <span className="metric-value">ONLINE</span>
            </div>
            <div className="metric">
              <span className="metric-label">PLULAB</span>
              <span className="metric-value">ACTIVE</span>
            </div>
            <div className="metric">
              <span className="metric-label">BYTE-STATUS</span>
              <span className="metric-value">OPERATIONAL</span>
            </div>
          </div>

          <motion.p
            className="flujos-text activatable"
            data-id="text1"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            En el <strong className="highlight-text">Pluniverse</strong>, los flujos son los circuitos que dan vida a tu Plubot.
          </motion.p>

          <motion.p
            className="flujos-text activatable"
            data-id="text2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Conecta nodos, activa poderes y desbloquea el poder de la automatización.
          </motion.p>

          <motion.button
            className="flujos-toggle cyberpunk-button"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => {
              setShowMore((prev) => !prev);
              playActivationSound();
            }}
          >
            <span className="button-glow"></span>
            <span className="button-text">
              {showMore ? 'CERRAR DATOS' : 'ACTIVAR DATOS'}
            </span>
            <div className="button-icon">
              {showMore ? '×' : '▶'}
            </div>
          </motion.button>

          <AnimatePresence>
            {showMore && (
              <motion.div
                className="flujos-story"
                variants={expandableContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="terminal-header">
                  <div className="terminal-icon"></div>
                  <div className="terminal-title">FLOW.PROTOCOL</div>
                  <div className="terminal-controls">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>

                <motion.p className="flujos-text terminal-text">
                  <span className="code-line">{'>'} Definiendo nodos...</span>
                  Nodos son los bloques básicos de un flujo: acciones, condiciones o integraciones.
                </motion.p>

                <motion.p className="flujos-text terminal-text">
                  <span className="code-line">{'>'} Construyendo flujos...</span>
                  Un flujo conecta nodos para definir el comportamiento de tu Plubot, como saludar o procesar pagos.
                </motion.p>

                <motion.p className="flujos-text terminal-text">
                  <span className="code-line">{'>'} Estableciendo conexiones...</span>
                  Usa el sistema drag-and-drop del PluLab para conectar nodos y crear lógica personalizada.
                </motion.p>

                <motion.p className="flujos-text terminal-text">
                  <span className="code-line">{'>'} Activando poderes...</span>
                  Integra herramientas como WhatsApp, Stripe o MercadoPago para potenciar tu Plubot.
                </motion.p>

                <motion.p className="flujos-text terminal-text">
                  <span className="code-line">{'>'} Construyendo un flujo...</span>
                  En el PluLab, arrastra nodos y conéctalos para crear flujos que puedes probar en tiempo real.
                </motion.p>

                <motion.p className="flujos-text terminal-text">
                  <span className="code-line">{'>'} Conectando WhatsApp...</span>
                  Usa el módulo de WhatsApp para que tu Plubot chatee con clientes en minutos.
                </motion.p>

                <motion.p className="flujos-text terminal-text">
                  <span className="code-line">{'>'} Integrando pagos...</span>
                  Añade Stripe o MercadoPago para que tu Plubot procese pagos directamente.
                </motion.p>

                <motion.p className="flujos-text terminal-text">
                  <span className="code-line">{'>'} Optimizando flujos...</span>
                  Mantén los flujos simples, prueba en el simulador y usa plantillas del PluBazaar.
                </motion.p>

                <motion.div
                  className="flujos-cta"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <motion.button
                    className="cyberpunk-button cta-button"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => {
                      window.location.href = '/pluniverse/factory';
                      playActivationSound();
                    }}
                  >
                    <span className="button-glow"></span>
                    CONSTRUYE TU FLUJO
                    <div className="button-icon">▶</div>
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="interface-elements">
          <div className="interface-dot"></div>
          <div className="interface-dot"></div>
          <div className="interface-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default TutorialesFlujos;
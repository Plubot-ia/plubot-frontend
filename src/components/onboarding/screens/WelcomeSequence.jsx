import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import plubotIcon from '@/assets/img/plubot.svg';

import usePlubotCreation from '../../../hooks/usePlubotCreation';

import './WelcomeSequence.css';

// Textos para la secuencia (movidos fuera para estabilidad)
const INTRO_TEXTS = [
  'En un universo interconectado donde los datos son el nuevo oro...',
  'Donde las ideas son infinitas pero el tiempo es el recurso más valioso...',
  'Nace una inteligencia nunca antes vista...',
  'PLUBOT - Tu asistente digital.',
];

// Versión optimizada - Componente más ligero sin tsParticles
const OptimizedParticles = () => {
  // Generar partículas una sola vez con IDs estables para las keys
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }).map(() => ({
        // eslint-disable-next-line sonarjs/pseudo-random
        id: Math.random(), // ID para key de React, memoizado y seguro en este contexto.
        // eslint-disable-next-line sonarjs/pseudo-random
        top: `${Math.random() * 100}%`,
        // eslint-disable-next-line sonarjs/pseudo-random
        left: `${Math.random() * 100}%`,
        // eslint-disable-next-line sonarjs/pseudo-random
        animationDelay: `${Math.random() * 5}s`,
        // eslint-disable-next-line sonarjs/pseudo-random
        animationDuration: `${3 + Math.random() * 7}s`,
      })),
    [],
  );

  return (
    <div className='optimized-particles'>
      {particles.map((p) => (
        <div
          key={p.id}
          className='optimized-particle'
          style={{
            top: p.top,
            left: p.left,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
          }}
        />
      ))}
    </div>
  );
};

const WelcomeSequence = () => {
  // Estado para las diferentes fases de la animación
  const [displayText, setDisplayText] = useState('');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [showSkipHint, setShowSkipHint] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const speedMs = 40; // Velocidad de escritura
  const phasePause = 1200; // Pausa entre frases

  const navigate = useNavigate();
  const { nextStep } = usePlubotCreation();
  const contentReference = useRef(null);
  const plubotAnimation = useAnimation();
  const backgroundAnimation = useAnimation();
  const glowAnimation = useAnimation();

  // Función para omitir la animación, envuelta en useCallback
  const skipAnimation = useCallback(() => {
    setDisplayText(INTRO_TEXTS.at(-1));
    setIsAnimationComplete(true);
    setIsButtonEnabled(true);
    setShowSkipHint(false);
  }, []);

  // Event listener para detectar la tecla Enter
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && !isAnimationComplete) {
        skipAnimation();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);

    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnimationComplete, skipAnimation]);

  // Event listener para detectar un toque en pantallas táctiles
  useEffect(() => {
    const handleTouch = () => {
      if (!isAnimationComplete) {
        skipAnimation();
      }
    };

    const touchElement = document.querySelector('.welcome-screen');
    if (touchElement) {
      touchElement.addEventListener('touchstart', handleTouch);

      return () => {
        touchElement.removeEventListener('touchstart', handleTouch);
      };
    }
    return () => {
      /* no-op */
    }; // Devolver siempre una función de limpieza
  }, [isAnimationComplete, skipAnimation]);

  // Simplificación de la animación flotante para Plubot
  useEffect(() => {
    // Animación flotante simplificada
    plubotAnimation.start({
      y: [-5, -10, -5],
      transition: {
        duration: 4,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'reverse',
      },
    });

    // Versión reducida y optimizada de la animación de fondo
    backgroundAnimation.start({
      background: [
        'radial-gradient(circle at 50% 50%, rgba(0,10,30,1) 0%, rgba(0,0,10,1) 100%)',
        'radial-gradient(circle at 40% 60%, rgba(5,15,40,1) 0%, rgba(0,5,20,1) 100%)',
      ],
      transition: {
        duration: 20,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'reverse',
      },
    });

    // Animación del resplandor
    glowAnimation.start({
      opacity: [0.3, 0.7, 0.3],
      scale: [1, 1.2, 1],
      transition: {
        duration: 3,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'reverse',
      },
    });
  }, [plubotAnimation, backgroundAnimation, glowAnimation]);

  // Secuencia de texto optimizada
  useEffect(() => {
    let isMounted = true;

    const typeTextSequence = async () => {
      // Iniciar la secuencia de tipeo con un retraso inicial menor
      await new Promise((resolve) => {
        setTimeout(resolve, 800);
      });

      // Para cada fase de texto
      for (const text of INTRO_TEXTS) {
        if (!isMounted) return;

        let currentText = '';

        // Escribir cada caracter con retraso
        for (let index = 0; index <= text.length; index++) {
          if (!isMounted) return;

          currentText = text.slice(0, index);
          setDisplayText(currentText);
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => {
            setTimeout(resolve, speedMs);
          });
        }

        // Pausa entre fases
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, phasePause);
        });
      }

      // Animación final y revelación del botón
      if (!isMounted) return;

      setIsAnimationComplete(true);
      await new Promise((resolve) => {
        setTimeout(resolve, 600);
      });
      setIsButtonEnabled(true);

      // Ocultar el texto de ayuda para omitir
      setShowSkipHint(false);
    };

    typeTextSequence();

    return () => {
      isMounted = false;
    };
  }, []);

  // Interacción al pasar el mouse sobre Plubot (simplificada)
  const handleHoverStart = () => {
    setIsHovered(true);
    plubotAnimation.start({
      scale: 1.2,
      rotate: 5,
      filter: 'drop-shadow(0 0 15px #00e0ff)',
      transition: { duration: 0.5 },
    });
  };

  const handleHoverEnd = () => {
    setIsHovered(false);
    plubotAnimation.start({
      scale: 1,
      rotate: 0,
      filter: 'drop-shadow(0 0 8px #00e0ff)',
      transition: { duration: 0.5 },
    });
  };

  // Navegación a la siguiente pantalla (simplificada)
  const handleNext = () => {
    // Animación de salida simple
    if (contentReference.current) {
      contentReference.current.style.transition =
        'transform 0.5s ease, opacity 0.5s ease';
      contentReference.current.style.transform = 'scale(0)';
      contentReference.current.style.opacity = '0';

      setTimeout(() => {
        nextStep();
        navigate('/factory');
      }, 500);
    }
  };

  return (
    <motion.div className='welcome-screen' animate={backgroundAnimation}>
      <OptimizedParticles />

      {/* Luces cósmicas reducidas */}
      <div className='cosmic-lights'>
        <div className='light-beam light-beam-1' />
        <div className='light-beam light-beam-3' />
      </div>

      {/* Texto para omitir la animación */}
      <AnimatePresence>
        {showSkipHint && (
          <motion.div
            className='skip-hint'
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1, duration: 1 }}
          >
            Presiona Enter para omitir
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className='welcome-content'
        ref={contentReference}
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <motion.div
          className='plubot-icon-container'
          onHoverStart={handleHoverStart}
          onHoverEnd={handleHoverEnd}
          animate={plubotAnimation}
          initial={{ y: -50, opacity: 0 }}
          transition={{ delay: 0.5, duration: 1, type: 'spring' }}
        >
          <motion.div className='plubot-glow' animate={glowAnimation} />
          <motion.div className='plubot-icon'>
            <img src={plubotIcon} alt='Plubot Icon' />
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className='plubot-greeting'
                  initial={{ scale: 0, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 5 }}
                  transition={{ duration: 0.4 }}
                >
                  ¡Hola! Soy Plubot, tu asistente creativo
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Halo de energía alrededor de Plubot */}
          <div className='energy-ring' />
        </motion.div>

        <motion.div
          className='intro-text-container'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
        >
          <h1 className='intro-text'>
            <div className='typewriter-container'>
              <div className='typewriter-line' />
              <div className='typewriter-text'>
                {displayText}
                <span className='cursor' />
              </div>
            </div>
          </h1>
        </motion.div>

        <AnimatePresence>
          {isAnimationComplete && (
            <motion.div
              className='epic-reveal'
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 0.8, 1] }}
              transition={{
                duration: 1,
                times: [0, 0.6, 1],
                ease: 'easeOut',
              }}
            >
              <div className='reveal-glow' />
              <div className='reveal-text'>PLUBOT</div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isButtonEnabled && (
            <motion.button
              className='intro-button'
              onClick={handleNext}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 0 20px rgba(0, 224, 255, 0.8)',
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <span className='button-text'>Descubre tu poder</span>
              <span className='button-glow' />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeSequence;

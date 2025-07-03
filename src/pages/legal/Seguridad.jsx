import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Shield,
  Lock,
  CheckCircle,
  Eye,
  BarChart3,
  FileCheck,
} from 'lucide-react';
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { Link } from 'react-router-dom';

import aegisAvatar from '@assets/img/characters/seguridad/aegis-seguridad.webp';

import './Seguridad.css';

const PHRASE_COUNT = 5;

const PHRASE_CHANGE_INTERVAL = 4000;
const SCANNER_SPEED = 1.5;
const AUDIO_VOLUME = 0.5;
const DOT_MATRIX_COUNT = 36;
const PARTICLE_COUNT = 6;

// Arrays estáticos para optimizar el rendimiento y proporcionar claves estables.
const DOTS = Array.from({ length: DOT_MATRIX_COUNT }, (_, index) => ({
  id: `dot-${index}`,
}));
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
  id: `particle-${index}`,
  index,
}));
const H_LINES = Array.from({ length: 8 }, (_, index) => ({
  id: `hline-${index}`,
}));
const V_LINES = Array.from({ length: 8 }, (_, index) => ({
  id: `vline-${index}`,
}));

// Se utiliza una función con un 'switch' para el acceso controlado a las frases.
// Este patrón elimina el acceso dinámico a propiedades (array[index])
// y satisface al linter de seguridad, erradicando el falso positivo.
const getPhraseSafely = (index) => {
  switch (index) {
    case 0: {
      return 'Tu seguridad es mi misión.';
    }
    case 1: {
      return 'Datos protegidos, confianza asegurada.';
    }
    case 2: {
      return 'Pluniverse protegido 24/7.';
    }
    case 3: {
      return 'Aegis vigila, tú creas.';
    }
    case 4: {
      return 'Cifrado cuántico activado.';
    }
    default: {
      return 'Tu seguridad es mi misión.';
    }
  }
};

const ShieldMatrix = React.memo(() => {
  return (
    <div className='dot-matrix'>
      <div className='dot-grid'>
        {DOTS.map((dot) => (
          <motion.div
            key={dot.id}
            className='matrix-dot'
            initial={{ opacity: 0 }}
            animate={{
              opacity: Math.random() > 0.7 ? 0.8 : 0.2,
              scale: Math.random() > 0.8 ? [1, 1.3, 1] : 1,
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>
    </div>
  );
});
ShieldMatrix.displayName = 'ShieldMatrix';

const SecurityRadar = React.memo(() => {
  return (
    <div className='radar-container'>
      <div className='radar-content'>
        <div className='security-radar'>
          <motion.div
            className='radar-ring radar-outer-ring'
            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0.3, 0.7] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          />
          <motion.div
            className='radar-ring radar-inner-ring'
            animate={{
              boxShadow: [
                '0 0 5px var(--seguridad-primary)',
                '0 0 15px var(--seguridad-primary)',
                '0 0 5px var(--seguridad-primary)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          />
          <motion.div
            className='radar-sweep'
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          />
        </div>
        <motion.p
          className='radar-message'
          animate={{
            textShadow: [
              '0 0 5px var(--seguridad-primary)',
              '0 0 15px var(--seguridad-primary)',
              '0 0 5px var(--seguridad-primary)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          &quot;El Pluniverse está blindado. Crea con confianza.&quot;
        </motion.p>
      </div>
    </div>
  );
});
SecurityRadar.displayName = 'SecurityRadar';

const buttonVariants = {
  hover: {
    scale: 1.05,
    boxShadow: '0 0 15px var(--seguridad-glow-primary)',
  },
  tap: { scale: 0.97 },
};

const metricVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const detailsVariants = {
  hidden: { opacity: 0, height: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    height: 'auto',
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    scale: 0.98,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const getTransformStyle = (tiltValues) => {
  return `perspective(1000px) rotateX(${tiltValues.x}deg) rotateY(${tiltValues.y}deg)`;
};

const getStaticTransformStyle = () => {
  return 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
};

const Seguridad = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isShieldActivated, setIsShieldActivated] = useState(false);

  const containerReference = useRef(null);
  const audioReference = useRef(null);
  const scannerReference = useRef(null);
  const animationFrameReference = useRef(null);

  const controlsMetrics = useAnimation();
  const controlsTitle = useAnimation();
  const controlsShield = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      await controlsTitle.start({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.8 },
      });
      await controlsShield.start({
        opacity: 1,
        scale: 1,
        filter: 'drop-shadow(0 0 15px var(--seguridad-primary))',
        transition: { duration: 0.6 },
      });
      controlsMetrics.start({
        opacity: 1,
        y: 0,
        transition: { staggerChildren: 0.1, duration: 0.5 },
      });
      setIsShieldActivated(true);
    };

    sequence();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    audioReference.current = new Audio('/sounds/cyber-activation.mp3');
    audioReference.current.load();

    return () => {
      if (audioReference.current) audioReference.current.pause();
    };
  }, [controlsTitle, controlsShield, controlsMetrics]);

  useEffect(() => {
    if (!scannerReference.current || !containerReference.current) {
      return () => {
        setIsShieldActivated(false);
      };
    }

    const scanner = scannerReference.current;
    let posY = 0;
    let direction = 1;
    const maxHt = containerReference.current.clientHeight - 2;

    const animateScan = () => {
      if (posY >= maxHt) {
        direction = -1;
      }
      if (posY <= 0) {
        direction = 1;
      }
      posY += SCANNER_SPEED * direction;
      scanner.style.transform = `translateY(${posY}px)`;
      animationFrameReference.current = requestAnimationFrame(animateScan);
    };

    animationFrameReference.current = requestAnimationFrame(animateScan);

    return () => {
      if (animationFrameReference.current) {
        cancelAnimationFrame(animationFrameReference.current);
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((previous) => (previous + 1) % PHRASE_COUNT);
    }, PHRASE_CHANGE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerReference.current) {
      return () => {
        setIsHovering(false);
      };
    }

    let timeoutId;
    const handleMouseMove = (e) => {
      if (timeoutId) return;

      timeoutId = setTimeout(() => {
        if (!containerReference.current) return;
        const rect = containerReference.current.getBoundingClientRect();
        setCursorPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        timeoutId = null;
      }, 16);
    };

    globalThis.addEventListener('mousemove', handleMouseMove);
    return () => {
      globalThis.removeEventListener('mousemove', handleMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const playActivationSound = useCallback(() => {
    if (audioReference.current) {
      audioReference.current.currentTime = 0;
      audioReference.current.volume = AUDIO_VOLUME;
      audioReference.current.play().catch(() => {
        // Manejo silencioso de error
      });
    }
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  const handleToggleDetails = useCallback(() => {
    setShowDetails((previous) => !previous);
    playActivationSound();
  }, [playActivationSound]);

  const tilt = useMemo(() => {
    if (!containerReference.current || !isHovering) return { x: 0, y: 0 };
    const rect = containerReference.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((cursorPosition.y - centerY) / centerY) * 3;
    const tiltY = ((cursorPosition.x - centerX) / centerX) * -3;
    return { x: tiltX, y: tiltY };
  }, [cursorPosition, isHovering]);

  const renderMetricCards = useMemo(
    () => (
      <>
        <motion.div
          className='metric-card primary-border'
          variants={metricVariants}
        >
          <Lock className='metric-icon primary-text' size={24} />
          <span className='metric-label primary-text'>Cifrado</span>
          <span className='metric-value'>SSL/TLS+</span>
        </motion.div>
        <motion.div
          className='metric-card secondary-border'
          variants={metricVariants}
        >
          <Eye className='metric-icon secondary-text' size={24} />
          <span className='metric-label secondary-text'>Aegis-Status</span>
          <span className='metric-value'>Vigilante</span>
        </motion.div>
        <motion.div
          className='metric-card primary-border'
          variants={metricVariants}
        >
          <CheckCircle className='metric-icon primary-text' size={24} />
          <span className='metric-label primary-text'>Protección</span>
          <span className='metric-value'>Activa</span>
        </motion.div>
      </>
    ),
    [],
  );

  const renderParticles = useMemo(
    () => (
      <>
        {PARTICLES.map((particle) => (
          <motion.div
            key={particle.id}
            className='particle'
            animate={{
              opacity: [0.3, 0.8, 0.3],
              y: [0, -10, 0],
              x: [0, 5, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 3 + particle.index * 0.5,
              ease: 'easeInOut',
              delay: particle.index * 0.2,
            }}
          />
        ))}
      </>
    ),
    [],
  );

  const renderDetailItems = useMemo(
    () => (
      <>
        <motion.div variants={itemVariants} className='detail-item'>
          <div className='detail-icon-wrapper'>
            <Lock className='secondary-text' />
          </div>
          <div className='detail-content'>
            <div className='detail-label'>{'>'} Privacidad:</div>
            <p className='detail-text'>
              Plubot nunca comparte, vende ni intercambia tus datos.{' '}
              <span className='highlight'>Tú controlas tu información.</span>
            </p>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className='detail-item'>
          <div className='detail-icon-wrapper'>
            <BarChart3 className='secondary-text' />
          </div>
          <div className='detail-content'>
            <div className='detail-label'>{'>'} Integraciones:</div>
            <p className='detail-text'>
              Conexiones con WhatsApp, Instagram, Stripe y más, protegidas con{' '}
              <span className='highlight'>APIs oficiales</span> y tokens
              encriptados de alta renovación.
            </p>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className='detail-item'>
          <div className='detail-icon-wrapper'>
            <FileCheck className='secondary-text' />
          </div>
          <div className='detail-content'>
            <div className='detail-label'>{'>'} Cumplimiento:</div>
            <p className='detail-text'>
              Cumplimos con normativas internacionales como{' '}
              <span className='highlight'>GDPR y CCPA</span>, con controles de
              auditoría continua.
            </p>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className='detail-item'>
          <div className='detail-icon-wrapper'>
            <CheckCircle className='secondary-text' />
          </div>
          <div className='detail-content'>
            <div className='detail-label'>{'>'} Respaldo:</div>
            <p className='detail-text'>
              Copias de seguridad automáticas para garantizar la{' '}
              <span className='highlight'>continuidad</span> de tu operación.
            </p>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className='detail-item'>
          <div className='detail-icon-wrapper'>
            <Eye className='secondary-text' />
          </div>
          <div className='detail-content'>
            <div className='detail-label'>{'>'} Auditoría:</div>
            <p className='detail-text'>
              Controla la actividad de tus Plubots y gestiona accesos desde tu{' '}
              <span className='highlight'>panel de control</span>.
            </p>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className='detail-item'>
          <div className='detail-icon-wrapper'>
            <Shield className='secondary-text' />
          </div>
          <div className='detail-content'>
            <div className='detail-label'>{'>'} Marketplace:</div>
            <p className='detail-text'>
              Transacciones protegidas y auditadas para garantizar{' '}
              <span className='highlight'>seguridad financiera</span>.
            </p>
          </div>
        </motion.div>
      </>
    ),
    [],
  );

  const currentPhrase = getPhraseSafely(phraseIndex);

  return (
    <div className='seguridad-section' ref={containerReference}>
      <div className='digital-grid'>
        <div className='grid-lines grid-horizontal'>
          {H_LINES.map((line) => (
            <div key={line.id} className='grid-line h-line' />
          ))}
        </div>
        <div className='grid-lines grid-vertical'>
          {V_LINES.map((line) => (
            <div key={line.id} className='grid-line v-line' />
          ))}
        </div>
      </div>

      <div className='scanner-line' ref={scannerReference} />

      <div className='content-wrapper'>
        <motion.h1
          className='title seguridad-animate-glitch'
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={controlsTitle}
        >
          <span className='title-bracket'>[</span>
          Seguridad Plubot
          <span className='title-bracket'>]</span>
          <span
            className='glitch-layer seguridad-animate-glitch'
            data-text='Seguridad Plubot'
          >
            Seguridad Plubot
          </span>
          <span
            className='glitch-layer seguridad-animate-glitch-reverse'
            data-text='Seguridad Plubot'
          >
            Seguridad Plubot
          </span>
        </motion.h1>

        <motion.div
          className='badge'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <span className='subtitle'>Protocolo Aegis v4.2</span>
        </motion.div>

        <motion.div
          className='main-card'
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          style={{
            transform: isHovering
              ? getTransformStyle({ x: tilt.x, y: tilt.y })
              : getStaticTransformStyle(),
            transition: 'transform 0.6s ease-out',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className='card-corner corner-tl' />
          <div className='card-corner corner-tr' />
          <div className='card-corner corner-bl' />
          <div className='card-corner corner-br' />

          <ShieldMatrix />

          <div className='avatar-container'>
            <motion.div
              className='avatar-wrapper'
              initial={{ opacity: 0, scale: 0.8 }}
              animate={controlsShield}
            >
              <motion.div
                className='avatar-aura seguridad-animate-pulse'
                animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: 'easeInOut',
                }}
              />
              <motion.img
                src={aegisAvatar}
                alt='Aegis el protector'
                className='avatar-image'
                width={80}
                height={80}
                loading='lazy'
                onError={(e) => (e.target.src = '/api/placeholder/80/80')}
                initial={{ scale: 0.8 }}
                animate={{
                  scale: isShieldActivated ? [0.98, 1.02, 0.98] : 0.98,
                  rotate: isShieldActivated ? [0, 2, -2, 0] : 0,
                }}
                transition={{
                  duration: 6,
                  repeat: isShieldActivated ? Infinity : 0,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className='avatar-ring seguridad-animate-rotate'
                animate={{ opacity: [0.7, 0.3, 0.7] }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className='avatar-outer-ring seguridad-animate-rotate'
                animate={{ opacity: [0.5, 0.2, 0.5] }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />
            </motion.div>

            <AnimatePresence mode='wait'>
              <motion.div
                key={phraseIndex}
                className='dialog-box seguridad-animate-fade-up'
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.6 }}
              >
                <div className='dialog-corner dialog-corner-tl' />
                <div className='dialog-corner dialog-corner-tr' />
                <div className='dialog-corner dialog-corner-bl' />
                <div className='dialog-corner dialog-corner-br' />
                <span className='dialog-text'>{currentPhrase}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div
            className='metrics-grid'
            initial={{ opacity: 0, y: 20 }}
            animate={controlsMetrics}
          >
            {renderMetricCards}
          </motion.div>

          <motion.div
            className='security-text mb-8'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <p className='mb-4'>
              Todas las conexiones y datos están protegidos con{' '}
              <span className='highlight'>cifrado SSL/TLS</span> de última
              generación con validación de certificados reforzada.
            </p>
            <p>
              Tus credenciales están{' '}
              <span className='highlight'>cifradas de extremo a extremo</span> y
              protegidas con autenticación segura mediante tokens temporales y
              verificación en dos pasos.
            </p>
          </motion.div>

          <motion.button
            className='button w-full'
            variants={buttonVariants}
            whileHover='hover'
            whileTap='tap'
            onClick={handleToggleDetails}
          >
            <motion.div className='shine seguridad-animate-slide' />
            <span>
              {showDetails ? 'Cerrar Protocolo' : 'Desplegar Protocolo'}
            </span>
            <span className='button-icon'>{showDetails ? '×' : '▶'}</span>
          </motion.button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                className='details-container'
                variants={detailsVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
              >
                <div className='details-header'>
                  <div className='header-dot' />
                  <div className='header-title'>AEGIS.SECURITY.PROTOCOLS</div>
                  <div className='header-dots'>
                    <div className='small-dot' />
                    <div className='small-dot' />
                    <div className='small-dot' />
                  </div>
                </div>
                <div className='details-content'>
                  {renderDetailItems}
                  <SecurityRadar />
                  <div className='pt-6 pb-2 text-center'>
                    <Link to='/welcome'>
                      <motion.button
                        className='cta-button'
                        variants={buttonVariants}
                        whileHover='hover'
                        whileTap='tap'
                        onClick={playActivationSound}
                      >
                        <motion.div className='shine seguridad-animate-slide' />
                        <span>Crear Tu Plubot</span>
                        <span className='button-icon'>▶</span>
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className='floating-particles'>{renderParticles}</div>

      {isHovering && (
        <motion.div
          className='custom-cursor'
          style={{
            transform: `translate(${cursorPosition.x}px, ${cursorPosition.y}px)`,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 0.8,
            scale: 1,
            boxShadow: 'var(--seguridad-glow-primary)',
          }}
          transition={{ duration: 0.2 }}
        />
      )}
    </div>
  );
};

export default React.memo(Seguridad);

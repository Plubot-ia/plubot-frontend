import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef, useMemo } from 'react';

import axiosInstance from '@/utils/axios-config.js';
import byteHappy from '@assets/img/byte-happy.png';
import byteNormal from '@assets/img/byte-normal.png';
import byteThinking from '@assets/img/byte-thinking.png';

import useWindowSize from '../../hooks/useWindowSize';

import './TuOpinion.css';

// Componente optimizado para las partículas
// Función de ayuda para generar números aleatorios más seguros
const secureRandom = () => {
  return crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32 - 1);
};

const ParticlesBackground = React.memo(({ count = 15 }) => {
  // Pre-calcular posiciones aleatorias para mejor rendimiento
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        id: crypto.randomUUID(),
        size: secureRandom() * 2 + 1,
        initialX: secureRandom() * 100,
        initialY: secureRandom() * 100,
        destX: secureRandom() * 100,
        destY: secureRandom() * 100,
        duration: secureRandom() * 10 + 15,
        delay: secureRandom() * 2,
      })),
    [count],
  );

  return (
    <div className='particles-bg'>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className='custom-particle'
          initial={{
            left: `${particle.initialX}%`,
            top: `${particle.initialY}%`,
            opacity: 0.3,
          }}
          animate={{
            left: [`${particle.initialX}%`, `${particle.destX}%`],
            top: [`${particle.initialY}%`, `${particle.destY}%`],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: particle.delay,
          }}
          style={{
            width: particle.size,
            height: particle.size,
          }}
        />
      ))}
    </div>
  );
});

ParticlesBackground.propTypes = {
  count: PropTypes.number,
};

ParticlesBackground.displayName = 'ParticlesBackground';

// Componente para el efecto de portal de energía
const EnergyPortal = React.memo(() => {
  return (
    <motion.div
      className='energy-portal'
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: [0.95, 1.02, 0.98, 1],
        opacity: [0, 0.7, 0.5],
      }}
      transition={{
        duration: 3,
        ease: 'easeInOut',
      }}
    />
  );
});
EnergyPortal.displayName = 'EnergyPortal';

// Componente optimizado para mensajes del formulario
const FormMessage = React.memo(({ message, status }) => {
  if (!message) return;

  return (
    <motion.div
      className={`form-message ${status}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
    >
      <div className='message-background'>
        <div className='message-circle' />
      </div>
      <div className='message-content'>
        <p>{message}</p>
        <motion.div
          className='message-icon'
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {status === 'success' ? '✓' : '!'}
        </motion.div>
      </div>
    </motion.div>
  );
});

FormMessage.propTypes = {
  message: PropTypes.string,
  status: PropTypes.string,
};

FormMessage.displayName = 'FormMessage';

// Campo de entrada optimizado
const InputField = React.memo(
  ({ type = 'text', name, placeholder, value, onChange, required = false }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <motion.div
        className={`input-wrapper ${isFocused ? 'active' : ''}`}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className='input-icon'>
          <motion.div
            className='icon-circle'
            animate={
              isFocused
                ? {
                    scale: [1, 1.3, 1.2],
                    backgroundColor: ['#00ffea', '#ff00ff', '#00ffea'],
                  }
                : {}
            }
            transition={{ duration: 1, repeat: isFocused ? Infinity : 0 }}
          />
        </div>
        {type === 'textarea' ? (
          <textarea
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className='opinion-input'
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        ) : (
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className='opinion-input'
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        )}
        <motion.div
          className='input-line'
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isFocused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    );
  },
);

InputField.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
};

InputField.displayName = 'InputField';

// Botón de envío con efectos optimizados
const SubmitButton = React.memo(({ loading, text }) => {
  return (
    <motion.button
      type='submit'
      className='quantum-btn'
      disabled={loading}
      whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(0, 255, 234, 0.4)' }}
      whileTap={{ scale: 0.97 }}
    >
      <motion.span
        className='btn-text'
        animate={loading ? { opacity: [1, 0.8, 1] } : {}}
        transition={{ duration: 1, repeat: loading ? Infinity : 0 }}
      >
        {loading ? 'Procesando...' : text}
      </motion.span>

      {loading && (
        <motion.span
          className='btn-loader'
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <motion.div
        className='btn-glow'
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
    </motion.button>
  );
});

SubmitButton.propTypes = {
  loading: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired,
};

SubmitButton.displayName = 'SubmitButton';

const TuOpinion = () => {
  const { width } = useWindowSize();
  const heroReference = useRef(undefined);
  const [formData, setFormData] = useState({ nombre: '', opinion: '' });
  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({
    text: undefined,
    status: undefined,
  });
  const [byteState, setByteState] = useState('normal');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const inViewport = useRef(false);
  const formReference = useRef(undefined);
  const mainControls = useAnimation();
  const idleCallbackIdReference = useRef(undefined);

  const getByteImage = () => {
    switch (byteState) {
      case 'happy': {
        return byteHappy;
      }
      case 'thinking': {
        return byteThinking;
      }
      default: {
        return byteNormal;
      }
    }
  };

  const startVisibilitySequence = React.useCallback(async () => {
    await mainControls.start({
      opacity: 1,
      transition: { duration: 0.5 },
    });
    setTimeout(() => setIsFormVisible(true), 800);
  }, [mainControls]);

  useEffect(() => {
    const heroElement = heroReference.current;

    const handleIntersection = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !inViewport.current) {
          inViewport.current = true;
          startVisibilitySequence();
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.2,
    });

    if (heroElement) {
      observer.observe(heroElement);
    }

    return () => {
      if (heroElement) {
        observer.unobserve(heroElement);
      }
    };
  }, [startVisibilitySequence]);

  useEffect(() => {
    const initInteractions = () => {
      // La variable de estado hasInteracted fue eliminada.
    };

    if ('requestIdleCallback' in globalThis) {
      idleCallbackIdReference.current = globalThis.requestIdleCallback(
        initInteractions,
        { timeout: 2000 },
      );
    } else {
      setTimeout(initInteractions, 2000);
    }

    return () => {
      mainControls.stop();
      if (
        'cancelIdleCallback' in globalThis &&
        idleCallbackIdReference.current
      ) {
        globalThis.cancelIdleCallback(idleCallbackIdReference.current);
        idleCallbackIdReference.current = undefined; // Clear the ref after cancelling
      }
    };
  }, [mainControls]);

  const handleChange = useMemo(
    () => (event) => {
      const { name, value } = event.target;
      setFormData((previous) => ({ ...previous, [name]: value }));
    },
    [],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setByteState('thinking');
    setFormMessage({ text: '', status: '' });

    const data = new FormData();
    data.append('nombre', formData.nombre);
    data.append('opinion', formData.opinion);

    try {
      await axiosInstance.post('opinion/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30_000, // Aumentado a 30s para dar más margen al backend
      });

      setFormMessage({
        text: '¡Tu opinión ha sido enviada al Pluniverse! Gracias por ayudarnos a mejorar.',
        status: 'success',
      });

      setFormData({ nombre: '', opinion: '' });
      setByteState('happy');

      setTimeout(() => setFormMessage({ text: '', status: '' }), 5000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        (error.code === 'ECONNABORTED'
          ? 'Tiempo de espera agotado. Intenta nuevamente.'
          : error.message) ||
        'Error al enviar tu opinión. Intenta nuevamente.';

      setFormMessage({ text: errorMessage, status: 'error' });
      setByteState('normal');

      setTimeout(() => setFormMessage({ text: '', status: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 70,
        damping: 12,
      },
    },
  };

  const sectionStyle = {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    overflow: 'hidden',
  };

  return (
    <motion.section
      className='opinion-hero'
      ref={heroReference}
      initial={{ opacity: 0 }}
      animate={mainControls}
      style={sectionStyle}
    >
      {inViewport.current && (
        <>
          <div
            className='particles-bg'
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 0,
            }}
          >
            <ParticlesBackground count={width > 768 ? 15 : 8} />
          </div>
          <div className='energy-portal-wrapper'>
            <EnergyPortal />
          </div>
        </>
      )}

      <motion.div
        className='byte-image-column'
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <div className='byte-image-wrapper'>
          <div className='byte-hologram-effect' />
          <img
            src={getByteImage()}
            alt='Byte Assistant'
            className={`byte-image ${loading ? 'byte-thinking' : ''}`}
          />
          <div className='byte-glow' />
        </div>
      </motion.div>

      <motion.div
        className='opinion-content'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <motion.h2
          className='opinion-title'
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.span
            className='neon-text'
            animate={{
              textShadow: [
                '0 0 15px #00ffea',
                '0 0 25px #00ffea',
                '0 0 15px #00ffea',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            Tu opinión
          </motion.span>{' '}
          da forma al{' '}
          <motion.span
            className='neon-text-alt'
            animate={{
              textShadow: [
                '0 0 15px #ff00ff',
                '0 0 25px #ff00ff',
                '0 0 15px #ff00ff',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: 1.5,
            }}
          >
            Pluniverse
          </motion.span>
        </motion.h2>

        <motion.p
          className='opinion-subtitle'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
        >
          ¡Hola! Soy Byte, tu guía en el Pluniverse. Comparte tus{' '}
          <motion.span
            className='highlight-text'
            animate={{
              color: ['#00ffea', '#88ffff', '#00ffea'],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            ideas
          </motion.span>
          , sugerencias o sueños para hacer de Plubot una experiencia aún más
          épica. ¡Tu voz importa!
        </motion.p>

        <AnimatePresence>
          {isFormVisible && (
            <motion.div
              className='form-container'
              ref={formReference}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ type: 'spring', stiffness: 40, damping: 15 }}
            >
              <motion.div
                className='holographic-overlay'
                animate={{
                  background: [
                    'linear-gradient(135deg, rgba(0, 255, 234, 0.05) 0%, rgba(255, 0, 255, 0.05) 50%, rgba(0, 255, 234, 0.05) 100%)',
                    'linear-gradient(225deg, rgba(0, 255, 234, 0.05) 0%, rgba(255, 0, 255, 0.05) 50%, rgba(0, 255, 234, 0.05) 100%)',
                    'linear-gradient(135deg, rgba(0, 255, 234, 0.05) 0%, rgba(255, 0, 255, 0.05) 50%, rgba(0, 255, 234, 0.05) 100%)',
                  ],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />

              <motion.form
                onSubmit={handleSubmit}
                className='opinion-form'
                variants={containerVariants}
                initial='hidden'
                animate='visible'
              >
                <motion.div variants={itemVariants}>
                  <InputField
                    name='nombre'
                    placeholder='Tu nombre (opcional)'
                    value={formData.nombre}
                    onChange={handleChange}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <InputField
                    type='textarea'
                    name='opinion'
                    placeholder='Comparte tu opinión, sugerencia o idea...'
                    value={formData.opinion}
                    onChange={handleChange}
                    required
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <SubmitButton loading={loading} text='Enviar Opinión' />
                </motion.div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {formMessage.text && (
            <FormMessage
              message={formMessage.text}
              status={formMessage.status}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
};

export default React.memo(TuOpinion);

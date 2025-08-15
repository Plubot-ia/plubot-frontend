import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useState, useMemo } from 'react';

import axiosInstance from '@/utils/axios-config.js';
import byteHappy from '@assets/img/byte-happy.png';
import byteNormal from '@assets/img/byte-normal.png';
import byteThinking from '@assets/img/byte-thinking.png';

// Helper: Crear variantes de animación
function _createAnimationVariants() {
  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
  };
}

// Helper: Manejar envío de formulario
async function _handleFormSubmit({
  event,
  loading,
  formData,
  setLoading,
  setByteState,
  setFormMessage,
  setFormData,
}) {
  event.preventDefault();
  if (loading || !formData.opinion) return;

  setLoading(true);
  setByteState('thinking');

  try {
    await axiosInstance.post('/opinion/', formData);
    setFormMessage({
      text: '¡Gracias! Tu opinión ha sido enviada.',
      status: 'success',
    });
    setFormData({ nombre: '', opinion: '' });
    setByteState('happy');
  } catch {
    setFormMessage({
      text: 'Error al enviar. Inténtalo de nuevo.',
      status: 'error',
    });
    setByteState('normal');
  } finally {
    setLoading(false);
    setTimeout(() => {
      setFormMessage({ text: undefined, status: undefined });
      setByteState('normal');
    }, 5000);
  }
}

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

// Subcomponente para el encabezado para reducir la complejidad del componente principal
const OpinionHeader = React.memo(() => (
  <>
    <motion.h2
      className='opinion-title'
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <motion.span
        className='neon-text'
        animate={{
          textShadow: ['0 0 15px #00ffea', '0 0 25px #00ffea', '0 0 15px #00ffea'],
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
          textShadow: ['0 0 15px #ff00ff', '0 0 25px #ff00ff', '0 0 15px #ff00ff'],
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
      , sugerencias o sueños para hacer de Plubot una experiencia aún más épica. ¡Tu voz importa!
    </motion.p>
  </>
));

OpinionHeader.displayName = 'OpinionHeader';

// Helper: Renderizar imagen de Byte
function _renderByteImage(byteState, loading) {
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

  return (
    <div className='byte-image-column'>
      <div className='byte-image-wrapper'>
        <div className='byte-hologram-effect' />
        <img
          src={getByteImage()}
          alt='Byte Assistant'
          className={`byte-image ${loading ? 'byte-thinking' : ''}`}
        />
        <div className='byte-glow' />
      </div>
    </div>
  );
}

// Helper: Renderizar campos del formulario
function _renderFormFields({ formData, handleChange, itemVariants, loading }) {
  return (
    <>
      <motion.div variants={itemVariants}>
        <InputField
          name='nombre'
          placeholder='Tu nombre (opcional)'
          value={formData.nombre}
          onChange={handleChange}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className='input-wrapper active'>
          <textarea
            name='opinion'
            placeholder='Comparte tu opinión, sugerencia o idea...'
            value={formData.opinion}
            onChange={handleChange}
            required
            className='opinion-input'
            rows='5'
          />
          <motion.div
            className='input-line'
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SubmitButton loading={loading} text='Enviar Opinión' />
      </motion.div>
    </>
  );
}

// Helper: Renderizar mensaje de formulario
function _renderFormMessage(formMessage) {
  return (
    <AnimatePresence>
      {formMessage.text && <FormMessage message={formMessage.text} status={formMessage.status} />}
    </AnimatePresence>
  );
}

const TuOpinion = () => {
  const [byteState, setByteState] = useState('normal');
  const [formData, setFormData] = useState({
    nombre: '',
    opinion: '',
  });
  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({
    text: undefined,
    status: undefined,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    await _handleFormSubmit({
      event,
      loading,
      formData,
      setLoading,
      setByteState,
      setFormMessage,
      setFormData,
    });
  };

  const { container: containerVariants, item: itemVariants } = _createAnimationVariants();

  return (
    <motion.section className='opinion-hero'>
      <ParticlesBackground count={15} />
      {_renderByteImage(byteState, loading)}

      <div className='opinion-content'>
        <EnergyPortal />
        <OpinionHeader />

        <motion.div
          className='form-container'
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 40, damping: 15 }}
        >
          <motion.form
            onSubmit={handleSubmit}
            className='opinion-form'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            {_renderFormFields({
              formData,
              handleChange,
              itemVariants,
              loading,
            })}
          </motion.form>

          {_renderFormMessage(formMessage)}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default React.memo(TuOpinion);

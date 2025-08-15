import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';

import axiosInstance from '@/utils/axios-config.js';

import useWindowSize from '../../hooks/useWindowSize';

import './Contact.css';

// Función de ayuda para generar números aleatorios más seguros
const secureRandom = () => {
  return crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32 - 1);
};

// Funciones de validación extraídas
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const calculateConnectionStrength = (formData) => {
  let strength = 0;

  if (formData.nombre) {
    strength += formData.nombre.length > 3 ? 30 : 15;
  }

  if (formData.email) {
    const isValidEmail = validateEmail(formData.email);
    strength += isValidEmail ? 35 : 20;
  }

  if (formData.mensaje) {
    strength += Math.min(Math.floor(formData.mensaje.length / 3), 35);
  }

  return Math.min(strength, 100);
};

// Función de envío de formulario extraída
const createFormSubmitHandler = (formData, setFormMessage) => {
  return async (event) => {
    event.preventDefault();
    const { nombre, email, mensaje } = formData;
    const isEmailValid = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

    if (!nombre.trim() || !email.trim() || !mensaje.trim()) {
      setFormMessage({
        text: 'Por favor, completa todos los campos.',
        status: 'error',
      });
      return;
    }

    if (!isEmailValid) {
      setFormMessage({
        text: 'Por favor, ingresa un email válido.',
        status: 'error',
      });
      return;
    }

    try {
      const response = await axiosInstance.post('/send-email', formData);
      if (response.status === 200) {
        setFormMessage({
          text: '¡Mensaje enviado con éxito! Te contactaremos pronto.',
          status: 'success',
        });
      }
    } catch {
      // Handle form submission error by showing user-friendly message
      setFormMessage({
        text: 'Hubo un error al enviar el mensaje. Inténtalo de nuevo.',
        status: 'error',
      });
    }
  };
};

// Funciones de manejo de formulario extraídas
const createFormHandlers = (setFormData, setActiveField, controls, formReference) => ({
  handleChange: (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  },

  handleFocus: (field) => {
    setActiveField(field);
    if (formReference.current) {
      controls.start({
        boxShadow: [
          '0 0 20px rgba(0, 255, 234, 0.3)',
          '0 0 30px rgba(0, 255, 234, 0.4)',
          '0 0 20px rgba(0, 255, 234, 0.3)',
        ],
        transition: {
          duration: 2.5,
          repeat: Infinity,
          repeatType: 'reverse',
        },
      });
    }
  },

  handleBlur: () => {
    setActiveField();
    controls.start({
      boxShadow: '0 0 20px rgba(0, 255, 234, 0.3)',
      transition: { duration: 0.5 },
    });
  },
});

// Variantes para animaciones (definidas fuera del componente para evitar recreaciones)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 10,
    },
  },
};

// Componentes extraídos para reducir el tamaño de la función principal
const ContactHeader = memo(({ titleControls }) => (
  <>
    <motion.h2 className='contact-title' initial={{ opacity: 0, y: -50 }} animate={titleControls}>
      <span className='neon-text'>Conéctate</span> con el{' '}
      <span className='neon-text-alt'>Futuro</span>
    </motion.h2>

    <motion.p
      className='contact-subtitle'
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: {
          duration: 1.5,
          ease: 'easeOut',
          delay: 0.5,
        },
      }}
    >
      Transmite tu señal al <span className='highlight-text'>Pluniverse</span> y descubre cómo{' '}
      <span className='highlight-text'>Plubot</span> impulsa tu visión con IA de vanguardia.
    </motion.p>
  </>
));

ContactHeader.displayName = 'ContactHeader';

ContactHeader.propTypes = {
  titleControls: PropTypes.object.isRequired,
};

const ConnectionDisplay = memo(({ connectionStrength }) => (
  <motion.div className='connection-container' variants={itemVariants}>
    <div className='connection-label'>
      <span className='connection-text'>Fuerza de Señal: {Math.round(connectionStrength)}%</span>
    </div>
    <div className='connection-bar'>
      <motion.div
        className='connection-fill'
        initial={{ width: 0 }}
        animate={{ width: `${connectionStrength}%` }}
        transition={{ type: 'spring', stiffness: 40 }}
      />
      <div className='connection-nodes'>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`connection-node-${index + 1}`}
            className={`connection-node ${connectionStrength >= (index + 1) * 20 ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  </motion.div>
));

ConnectionDisplay.displayName = 'ConnectionDisplay';

ConnectionDisplay.propTypes = {
  connectionStrength: PropTypes.number.isRequired,
};

const SubmitButton = memo(({ loading }) => (
  <motion.button
    type='submit'
    className='quantum-btn contact-btn'
    disabled={loading}
    variants={itemVariants}
    whileHover={{
      scale: 1.03,
      boxShadow: '0 0 20px rgba(0, 255, 234, 0.5)',
    }}
    whileTap={{ scale: 0.97 }}
  >
    <span className='btn-text'>{loading ? 'Enviando...' : 'Enviar Mensaje'}</span>
    {loading && (
      <motion.span
        className='btn-loader'
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    )}
    <div className='btn-glow' />
  </motion.button>
));

SubmitButton.displayName = 'SubmitButton';

SubmitButton.propTypes = {
  loading: PropTypes.bool.isRequired,
};

const FormMessage = memo(({ formMessage }) => (
  <AnimatePresence>
    {formMessage.text && (
      <motion.div
        className={`form-message ${formMessage.status}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 150,
            damping: 15,
          },
        }}
        exit={{
          opacity: 0,
          y: 20,
          transition: { duration: 0.4 },
        }}
      >
        <span className='message-icon'>{formMessage.status === 'success' ? '✓' : '⚠'}</span>
        {formMessage.text}
      </motion.div>
    )}
  </AnimatePresence>
));

FormMessage.displayName = 'FormMessage';

FormMessage.propTypes = {
  formMessage: PropTypes.shape({
    text: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
};

// Formulario extraído como componente separado
const ContactForm = memo(
  ({
    formData,
    handleChange,
    handleFocus,
    handleBlur,
    handleSubmit,
    activeField,
    connectionStrength,
    loading,
  }) => (
    <motion.form
      onSubmit={handleSubmit}
      id='contact-form'
      className='contact-form'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      <InputField
        name='nombre'
        placeholder='Tu nombre'
        value={formData.nombre}
        onChange={handleChange}
        onFocus={() => handleFocus('nombre')}
        onBlur={handleBlur}
        isActive={activeField === 'nombre'}
      />

      <InputField
        type='email'
        name='email'
        placeholder='Tu email'
        value={formData.email}
        onChange={handleChange}
        onFocus={() => handleFocus('email')}
        onBlur={handleBlur}
        isActive={activeField === 'email'}
      />

      <InputField
        type='textarea'
        name='mensaje'
        placeholder='Tu mensaje para el Pluniverse'
        value={formData.mensaje}
        onChange={handleChange}
        onFocus={() => handleFocus('mensaje')}
        onBlur={handleBlur}
        isActive={activeField === 'mensaje'}
      />

      <ConnectionDisplay connectionStrength={connectionStrength} />

      <SubmitButton loading={loading} />
    </motion.form>
  ),
);

ContactForm.displayName = 'ContactForm';

ContactForm.propTypes = {
  formData: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleFocus: PropTypes.func.isRequired,
  handleBlur: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  activeField: PropTypes.string,
  connectionStrength: PropTypes.number.isRequired,
  loading: PropTypes.bool.isRequired,
};

// Custom hooks para reducir la lógica del componente principal
const useFormVisibility = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFormVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return isFormVisible;
};

const useTitleAnimation = () => {
  const titleControls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      await titleControls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 1, ease: 'easeOut' },
      });

      titleControls.start({
        textShadow: [
          '0 0 15px #00ffea, 0 0 30px #ff00ff',
          '0 0 25px #00ffea, 0 0 40px #ff00ff',
          '0 0 15px #00ffea, 0 0 30px #ff00ff',
        ],
        transition: {
          duration: 4,
          repeat: Infinity,
          repeatType: 'reverse',
        },
      });
    };

    sequence();
  }, [titleControls]);

  return titleControls;
};

const useConnectionStrength = (formData) => {
  const [connectionStrength, setConnectionStrength] = useState(0);

  const calculateStrength = useCallback(() => {
    return calculateConnectionStrength(formData);
  }, [formData]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setConnectionStrength(calculateStrength());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [calculateStrength]);

  return connectionStrength;
};

const useFormMessageAutoHide = (formMessage, setFormMessage) => {
  useEffect(() => {
    if (formMessage.text) {
      const timer = setTimeout(() => {
        setFormMessage({ text: '', status: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [formMessage, setFormMessage]);
};

// Componentes memoizados para evitar re-renderizados innecesarios
const Particle = memo(({ index }) => {
  // Valores pre-calculados para evitar cálculos en cada renderizado
  const { width, height } = useWindowSize();
  const initialX = useMemo(() => secureRandom() * (width ?? 0), [width]);
  const initialY = useMemo(() => secureRandom() * (height ?? 0), [height]);
  const targetX = useMemo(() => secureRandom() * (width ?? 0), [width]);
  const targetY = useMemo(() => secureRandom() * (height ?? 0), [height]);
  const duration = useMemo(() => secureRandom() * 15 + 20, []);
  const initialOpacity = useMemo(() => secureRandom() * 0.4 + 0.2, []);
  const bgColor = useMemo(
    () => `rgb(${secureRandom() * 80}, ${secureRandom() * 200}, ${secureRandom() * 255 + 180})`,
    [],
  );
  const shadowSize = useMemo(() => secureRandom() * 8 + 4, []);
  const size = useMemo(() => secureRandom() * 8 + 2, []);
  const uniqueId = useMemo(() => `particle-${index}`, [index]);

  return (
    <motion.div
      key={uniqueId}
      className='custom-particle'
      initial={{
        x: initialX,
        y: initialY,
        opacity: initialOpacity,
      }}
      animate={{
        x: [initialX, targetX],
        y: [initialY, targetY],
        opacity: [0.2, 0.5, 0.2],
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
      style={{
        width: size,
        height: size,
        background: bgColor,
        boxShadow: `0 0 ${shadowSize}px rgba(0, 255, 234, 0.5)`,
      }}
    />
  );
});

Particle.propTypes = {
  index: PropTypes.string.isRequired,
};

Particle.displayName = 'Particle';

const NeuralNode = memo(({ index }) => {
  const duration = useMemo(() => secureRandom() * 3 + 2, []);
  const delay = useMemo(() => secureRandom() * 1.5, []);
  const left = useMemo(() => `${secureRandom() * 100}%`, []);
  const top = useMemo(() => `${secureRandom() * 100}%`, []);
  const uniqueId = useMemo(() => `neural-node-${index}`, [index]);

  return (
    <motion.div
      key={uniqueId}
      className='neural-node'
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.2, 0.6, 0.2],
        transition: {
          duration,
          delay,
          repeat: Infinity,
        },
      }}
      style={{ left, top }}
    />
  );
});

NeuralNode.propTypes = {
  index: PropTypes.string.isRequired,
};

NeuralNode.displayName = 'NeuralNode';

const InputField = memo(
  ({ type = 'text', name, placeholder, value, onChange, onFocus, onBlur, isActive }) => {
    const InputComponent = type === 'textarea' ? 'textarea' : 'input';

    return (
      <motion.div className={`input-wrapper ${isActive ? 'active' : ''}`} variants={itemVariants}>
        <div className='input-icon'>
          <div className='icon-circle' />
        </div>
        <InputComponent
          type={type === 'textarea' ? undefined : type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          required
          className='contact-input'
        />
        <div className='input-line' />
      </motion.div>
    );
  },
);

InputField.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
};

InputField.displayName = 'InputField';

const Contact = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: '',
  });
  const [formMessage, setFormMessage] = useState({ text: '', status: '' });
  const [activeField, setActiveField] = useState();
  const loading = false;

  const formReference = useRef(undefined);
  const controls = useAnimation();

  // Custom hooks para manejar la lógica extraída
  const isFormVisible = useFormVisibility();
  const titleControls = useTitleAnimation();
  const connectionStrength = useConnectionStrength(formData);
  useFormMessageAutoHide(formMessage, setFormMessage);

  // Handlers memoizados para evitar recreaciones en cada renderizado
  const { handleChange, handleFocus, handleBlur } = useMemo(
    () => createFormHandlers(setFormData, setActiveField, controls, formReference),
    [controls],
  );

  const handleSubmit = useMemo(() => createFormSubmitHandler(formData, setFormMessage), [formData]);

  // Memoizar partículas para evitar recálculos en cada renderizado
  const particles = useMemo(() => {
    const particleIds = Array.from({ length: 25 }, (_, index) => `particle-${index}`);
    return particleIds.map((id) => <Particle key={id} index={id} />);
  }, []);

  // Memoizar nodos neurales
  const neuralNodes = useMemo(() => {
    const neuralNodeIds = Array.from({ length: 15 }, (_, index) => `neural-node-${index}`);
    return neuralNodeIds.map((id) => <NeuralNode key={id} index={id} />);
  }, []);

  return (
    <section className='contact-hero'>
      {/* Fondo de partículas optimizado */}
      <div className='particles-bg'>{particles}</div>

      {/* Portal de energía en el fondo */}
      <div className='energy-portal' />

      <div className='contact-content'>
        <ContactHeader titleControls={titleControls} />

        <motion.p
          className='contact-subtitle'
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: {
              duration: 1.5,
              ease: 'easeOut',
              delay: 0.5,
            },
          }}
        >
          Transmite tu señal al <span className='highlight-text'>Pluniverse</span> y descubre cómo{' '}
          <span className='highlight-text'>Plubot</span> impulsa tu visión con IA de vanguardia.
        </motion.p>

        <motion.div className='neural-network-visual'>{neuralNodes}</motion.div>

        <AnimatePresence>
          {isFormVisible && (
            <motion.div
              className='form-container'
              ref={formReference}
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { type: 'spring', stiffness: 50, damping: 15 },
              }}
              exit={{ opacity: 0, y: -50 }}
            >
              <div className='holographic-overlay' />

              <ContactForm
                formData={formData}
                handleChange={handleChange}
                handleFocus={handleFocus}
                handleBlur={handleBlur}
                handleSubmit={handleSubmit}
                activeField={activeField}
                connectionStrength={connectionStrength}
                loading={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FormMessage formMessage={formMessage} />

      <div className='ambient-light light-1' />
      <div className='ambient-light light-2' />
    </section>
  );
};

export default memo(Contact);

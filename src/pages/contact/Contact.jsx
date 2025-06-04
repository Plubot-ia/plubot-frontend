import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/utils/axiosConfig';
import './Contact.css';
import LazyImage from '@/components/common/LazyImage';

// Componentes memoizados para evitar re-renderizados innecesarios
const Particle = memo(({ index }) => {
  // Valores pre-calculados para evitar cálculos en cada renderizado
  const size = useMemo(() => Math.random() * 3 + 1, []);
  const initialX = useMemo(() => Math.random() * window.innerWidth, []);
  const initialY = useMemo(() => Math.random() * window.innerHeight, []);
  const targetX = useMemo(() => Math.random() * window.innerWidth, []);
  const targetY = useMemo(() => Math.random() * window.innerHeight, []);
  const duration = useMemo(() => Math.random() * 15 + 20, []);
  const initialOpacity = useMemo(() => Math.random() * 0.4 + 0.2, []);
  const bgColor = useMemo(() => 
    `rgb(${Math.random() * 80}, ${Math.random() * 200}, ${Math.random() * 255 + 180})`, 
  []);
  const shadowSize = useMemo(() => Math.random() * 8 + 4, []);

  return (
    <motion.div
      key={index}
      className="custom-particle"
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

const NeuralNode = memo(({ index }) => {
  const duration = useMemo(() => Math.random() * 3 + 2, []);
  const delay = useMemo(() => Math.random() * 1.5, []);
  const left = useMemo(() => `${Math.random() * 100}%`, []);
  const top = useMemo(() => `${Math.random() * 100}%`, []);

  return (
    <motion.div
      key={index}
      className="neural-node"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.2, 0.6, 0.2],
        transition: {
          duration,
          delay,
          repeat: Infinity,
        },
      }}
      style={{
        left,
        top,
      }}
    />
  );
});

const InputField = memo(({ 
  type = 'text', 
  name, 
  placeholder, 
  value, 
  onChange, 
  onFocus, 
  onBlur, 
  isActive 
}) => {
  const InputComponent = type === 'textarea' ? 'textarea' : 'input';
  
  return (
    <motion.div 
      className={`input-wrapper ${isActive ? 'active' : ''}`} 
      variants={itemVariants}
    >
      <div className="input-icon">
        <div className="icon-circle"></div>
      </div>
      <InputComponent
        type={type !== 'textarea' ? type : undefined}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        required
        className="contact-input"
      />
      <div className="input-line"></div>
    </motion.div>
  );
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

const Contact = () => {
  const [formData, setFormData] = useState({ nombre: '', email: '', mensaje: '' });
  const [formMessage, setFormMessage] = useState({ text: '', status: '' });
  const [connectionStrength, setConnectionStrength] = useState(0);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [loading, setLoading] = useState(false);

  const formRef = useRef(null);
  const controls = useAnimation();
  const titleControls = useAnimation();

  // Efecto para mostrar el formulario con delay (optimizado)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFormVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Animación del título (optimizada)
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

  // Cálculo de la fuerza de conexión (memoizado)
  const calculateStrength = useCallback(() => {
    let strength = 0;

    if (formData.nombre) {
      strength += formData.nombre.length > 3 ? 30 : 15;
    }

    if (formData.email) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      strength += isValidEmail ? 35 : 20;
    }

    if (formData.mensaje) {
      strength += Math.min(Math.floor(formData.mensaje.length / 3), 35);
    }

    return Math.min(strength, 100);
  }, [formData.nombre, formData.email, formData.mensaje]);

  // Actualizar la fuerza de conexión con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setConnectionStrength(calculateStrength());
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [calculateStrength]);

  // Handlers memoizados para evitar recreaciones en cada renderizado
  const handleChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleFocus = useCallback((field) => {
    setActiveField(field);
    if (formRef.current) {
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
  }, [controls]);

  const handleBlur = useCallback(() => {
    setActiveField(null);
    controls.start({
      boxShadow: '0 0 20px rgba(0, 255, 234, 0.3)',
      transition: { duration: 0.5 },
    });
  }, [controls]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormMessage({ text: '', status: '' });

    // Crear un objeto FormData para enviar como multipart/form-data
    const data = new FormData();
    data.append('nombre', formData.nombre);
    data.append('email', formData.email);
    data.append('message', formData.mensaje);

    try {
      const response = await axiosInstance.post('/contact', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormMessage({ 
        text: response.data.message || '¡Mensaje recibido en el Pluniverse!', 
        status: 'success' 
      });
      setFormData({ nombre: '', email: '', mensaje: '' });
      setTimeout(() => setFormMessage({ text: '', status: '' }), 5000);
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error en la transmisión. Intenta nuevamente.';
      setFormMessage({ text: errorMessage, status: 'error' });
      setTimeout(() => setFormMessage({ text: '', status: '' }), 5000);
    } finally {
      setLoading(false);
    }
  }, [formData]);

  // Memoizar partículas para evitar recálculos en cada renderizado
  const particles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, index) => (
      <Particle key={index} index={index} />
    ));
  }, []);

  // Memoizar nodos neurales
  const neuralNodes = useMemo(() => {
    return Array.from({ length: 8 }).map((_, index) => (
      <NeuralNode key={index} index={index} />
    ));
  }, []);

  return (
    <section className="contact-hero">
      {/* Fondo de partículas optimizado */}
      <div className="particles-bg">{particles}</div>

      {/* Portal de energía en el fondo */}
      <div className="energy-portal" />

      <div className="contact-content">
        <motion.h2
          className="contact-title"
          data-text="Conéctate con el Futuro"
          initial={{ opacity: 0, y: -50 }}
          animate={titleControls}
        >
          <span className="neon-text">Conéctate</span> con el <span className="neon-text-alt">Futuro</span>
        </motion.h2>

        <motion.p
          className="contact-subtitle"
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
          Transmite tu señal al <span className="highlight-text">Pluniverse</span> y descubre cómo{' '}
          <span className="highlight-text">Plubot</span> impulsa tu visión con IA de vanguardia.
        </motion.p>

        <motion.div className="neural-network-visual">
          {neuralNodes}
        </motion.div>

        <AnimatePresence>
          {isFormVisible && (
            <motion.div
              className="form-container"
              ref={formRef}
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { type: 'spring', stiffness: 50, damping: 15 },
              }}
              exit={{ opacity: 0, y: -50 }}
            >
              <div className="holographic-overlay"></div>

              <motion.form
                onSubmit={handleSubmit}
                id="contact-form"
                className="contact-form"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <InputField
                  name="nombre"
                  placeholder="Tu nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  onFocus={() => handleFocus('nombre')}
                  onBlur={handleBlur}
                  isActive={activeField === 'nombre'}
                />

                <InputField
                  type="email"
                  name="email"
                  placeholder="Tu email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus('email')}
                  onBlur={handleBlur}
                  isActive={activeField === 'email'}
                />

                <InputField
                  type="textarea"
                  name="mensaje"
                  placeholder="Tu mensaje para el Pluniverse"
                  value={formData.mensaje}
                  onChange={handleChange}
                  onFocus={() => handleFocus('mensaje')}
                  onBlur={handleBlur}
                  isActive={activeField === 'mensaje'}
                />

                <motion.div className="connection-container" variants={itemVariants}>
                  <div className="connection-label">
                    <span className="connection-text">Fuerza de Señal: {Math.round(connectionStrength)}%</span>
                  </div>
                  <div className="connection-bar">
                    <motion.div
                      className="connection-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${connectionStrength}%` }}
                      transition={{ type: 'spring', stiffness: 40 }}
                    />
                    <div className="connection-nodes">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`connection-node ${connectionStrength >= (i + 1) * 20 ? 'active' : ''}`} 
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  className="quantum-btn contact-btn"
                  disabled={loading}
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: '0 0 20px rgba(0, 255, 234, 0.5)',
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="btn-text">{loading ? 'Enviando...' : 'Enviar Mensaje'}</span>
                  {loading && (
                    <motion.span
                      className="btn-loader"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                  <div className="btn-glow"></div>
                </motion.button>
              </motion.form>

              <AnimatePresence>
                {formMessage.text && (
                  <motion.div
                    className={`form-message ${formMessage.status}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { type: 'spring', stiffness: 150, damping: 15 },
                    }}
                    exit={{
                      opacity: 0,
                      y: 20,
                      transition: { duration: 0.4 },
                    }}
                  >
                    <span className="message-icon">
                      {formMessage.status === 'success' ? '✓' : '⚠'}
                    </span>
                    {formMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="ambient-light light-1" />
      <div className="ambient-light light-2" />
    </section>
  );
};

export default memo(Contact);
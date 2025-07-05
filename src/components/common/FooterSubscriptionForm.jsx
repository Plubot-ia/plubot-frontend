import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import axiosInstance from '../../utils/axios-config';

const FooterSubscriptionForm = () => {
  const [formData, setFormData] = useState({ builderEmail: '' });
  const [formMessage, setFormMessage] = useState({ text: '', status: '' });
  const [loading, setLoading] = useState(false);

  const handleBuilderForm = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFormMessage({ text: '', status: '' });

    const data = new FormData();
    data.append('email', formData.builderEmail);

    try {
      const response = await axiosInstance.post('subscribe', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormMessage({
        text:
          response.data.message ||
          '¡Bienvenido, Arquitecto! Pronto te contactaremos para construir el Pluniverse.',
        status: 'success',
      });
      setFormData({ builderEmail: '' });
      setTimeout(() => setFormMessage({ text: '', status: '' }), 5000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Error al suscribirte. Intenta nuevamente.';
      setFormMessage({ text: errorMessage, status: 'error' });
      setTimeout(() => setFormMessage({ text: '', status: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  return (
    <div className='footer-builder-section'>
      <h3 className='footer-title'>
        ¡Conviértete en Arquitecto del Pluniverse!
      </h3>
      <p className='footer-description'>
        Únete a nuestra misión como creador, desarrollador o visionario.
        ¡Forjemos juntos el futuro del Pluniverse!
      </p>
      <form
        id='footer-builder-form'
        onSubmit={handleBuilderForm}
        className='subscribe-form'
        aria-label='Formulario de suscripción al Pluniverse'
      >
        <div className='footer-subscribe'>
          <div className='subscribe-input-wrapper'>
            <input
              type='email'
              name='builderEmail'
              placeholder='Tu correo electrónico'
              value={formData.builderEmail}
              onChange={handleChange}
              required
              className='subscribe-input'
              aria-describedby='email-description'
            />
            <p id='email-description' className='sr-only'>
              Ingresa tu correo electrónico para unirte como Arquitecto del
              Pluniverse.
            </p>
          </div>
          <button
            type='submit'
            className='subscribe-btn'
            disabled={loading}
            aria-label={
              loading
                ? 'Enviando formulario'
                : 'Enviar formulario de suscripción'
            }
          >
            <span className='btn-text'>
              {loading ? 'Enviando...' : 'Forjar mi Destino'}
            </span>
            {loading && (
              <motion.span
                className='btn-loader'
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </button>
        </div>
      </form>
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
            <div className='message-background'>
              <div className='message-circle' />
            </div>
            <div className='message-content'>
              <p id='form-message-text'>{formMessage.text}</p>
              <motion.div
                className='message-icon'
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                {formMessage.status === 'success' ? '✓' : '!'}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FooterSubscriptionForm;

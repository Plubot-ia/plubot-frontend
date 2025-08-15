import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

const ResendCard = ({
  email,
  message,
  isSubmitting,
  setEmail,
  handleResend,
  getContextualMessage,
}) => (
  <motion.div
    className='resend-card'
    initial={{ opacity: 0, scale: 0.9, y: 50 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
  >
    <div className='resend-card-header'>
      <div className='resend-logo'>
        <img src='/logo.svg' alt='PLUBOT' />
      </div>
      <h2 className='resend-card-title'>Reenviar Verificación</h2>
      <p className='resend-card-subtitle'>{getContextualMessage()}</p>
    </div>
    {message.text?.length > 0 && (
      <div
        key={message.text}
        className={`resend-message resend-message-${message.type} resend-show`}
        aria-live='polite'
      >
        {message.text}
      </div>
    )}
    <form onSubmit={handleResend}>
      <div className='resend-form-group'>
        <label htmlFor='email' className='resend-form-label'>
          Email
        </label>
        <input
          type='email'
          id='email'
          name='email'
          className='resend-form-input'
          placeholder='correo@ejemplo.com'
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          aria-required='true'
        />
      </div>
      <motion.button
        type='submit'
        className='resend-btn'
        disabled={isSubmitting}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isSubmitting ? 'Enviando...' : 'Reenviar Correo de Verificación'}
      </motion.button>
    </form>

    <div className='resend-form-footer'>
      <p className='mt-4 text-center'>
        ¿Recordaste tu contraseña?{' '}
        <Link to='/login' className='text-plubot-accent hover:underline'>
          Iniciar Sesión
        </Link>
      </p>
    </div>
  </motion.div>
);

ResendCard.propTypes = {
  email: PropTypes.string.isRequired,
  message: PropTypes.shape({
    text: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  setEmail: PropTypes.func.isRequired,
  handleResend: PropTypes.func.isRequired,
  getContextualMessage: PropTypes.func.isRequired,
};

export default ResendCard;

import { Link } from 'react-router-dom';

import useCardTiltEffect from '../../hooks/useCardTiltEffect';
import useForgotPasswordForm from '../../hooks/useForgotPasswordForm';

import './ForgotPassword.css';

const ForgotPassword = () => {
  const cardRef = useCardTiltEffect();
  const { email, setEmail, message, isSubmitting, handleSubmit } = useForgotPasswordForm();

  return (
    <div className='forgot-password-container'>
      <div className='forgot-password-cosmic-lights'>
        <div className='forgot-password-light-beam forgot-password-light-beam-1' />
        <div className='forgot-password-light-beam forgot-password-light-beam-2' />
        <div className='forgot-password-light-beam forgot-password-light-beam-3' />
      </div>
      <div className='forgot-password-particles'>
        <div className='forgot-password-particle forgot-password-particle-1' />
        <div className='forgot-password-particle forgot-password-particle-2' />
        <div className='forgot-password-particle forgot-password-particle-3' />
        <div className='forgot-password-particle forgot-password-particle-4' />
        <div className='forgot-password-particle forgot-password-particle-5' />
        <div className='forgot-password-particle forgot-password-particle-6' />
      </div>
      <div ref={cardRef} className='forgot-password-card'>
        <div className='forgot-password-card-header'>
          <div className='forgot-password-logo'>
            <img src='/logo.svg' alt='PLUBOT' />
          </div>
          <h2 className='forgot-password-card-title'>Recuperar Contraseña</h2>
          <p className='forgot-password-card-subtitle'>
            Ingresa tu email para recibir un enlace de restablecimiento 📧
          </p>
        </div>
        {message.text && (
          <div
            className={`forgot-password-message forgot-password-message-${message.type} forgot-password-show`}
          >
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className='forgot-password-form-group'>
            <label className='forgot-password-form-label' htmlFor='email'>
              Correo Electrónico
            </label>
            <input
              type='email'
              id='email'
              name='email'
              className='forgot-password-form-input'
              placeholder='correo@ejemplo.com'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <button type='submit' className='forgot-password-btn' disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar Enlace'}
          </button>
        </form>
        <div className='forgot-password-form-footer'>
          <p>
            ¿Recordaste tu contraseña?{' '}
            <Link to='/login' className='forgot-password-form-footer-link'>
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

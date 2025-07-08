import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import useRegister from '../../hooks/useRegister';

import GoogleAuthButton from './GoogleAuthButton';
import './Register.css';

const Register = () => {
  const {
    name,
    setName,
    email,
    password,
    confirmPassword,
    setConfirmPassword,
    message,
    strength,
    isSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  } = useRegister();

  return (
    <div className='register-register-container'>
      <div className='register-cosmic-lights'>
        <div className='register-light-beam register-light-beam-1' />
        <div className='register-light-beam register-light-beam-2' />
        <div className='register-light-beam register-light-beam-3' />
      </div>
      <div className='register-particles'>
        <div className='register-particle register-particle-1' />
        <div className='register-particle register-particle-2' />
        <div className='register-particle register-particle-3' />
        <div className='register-particle register-particle-4' />
        <div className='register-particle register-particle-5' />
        <div className='register-particle register-particle-6' />
      </div>
      <div className='register-register-card'>
        <div className='register-card-header'>
          <div className='register-logo'>
            <img src='/logo.svg' alt='PLUBOT' />
          </div>
          <h1 className='register-card-title'>CREAR CUENTA</h1>
          <p className='register-card-subtitle'>
            Comienza a crear tu compañero digital
          </p>
        </div>
        {message.text && (
          <div
            className={`register-message register-message-${message.type} register-show`}
          >
            {message.text}
          </div>
        )}
        <form id='register-form' action='' onSubmit={handleSubmit}>
          <div className='register-form-group'>
            <label htmlFor='name' className='register-form-label'>
              Nombre completo
            </label>
            <input
              type='text'
              id='name'
              name='name'
              className='register-form-input'
              placeholder='Tu nombre completo'
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className='register-form-group'>
            <label htmlFor='email' className='register-form-label'>
              Correo electrónico
            </label>
            <input
              type='email'
              id='email'
              name='email'
              className='register-form-input'
              placeholder='correo@ejemplo.com'
              value={email}
              onChange={handleEmailChange}
              required
            />
          </div>
          <div className='register-form-group'>
            <label htmlFor='password' className='register-form-label'>
              Contraseña
            </label>
            <div className='register-input-wrapper'>
              <input
                type={showPassword ? 'text' : 'password'}
                id='password'
                name='password'
                className='register-form-input'
                placeholder='Crea una contraseña segura'
                value={password}
                onChange={handlePasswordChange}
                required
              />
              <button
                type='button'
                className='register-toggle-password'
                onClick={() => setShowPassword(!showPassword)}
                aria-label='Mostrar/Ocultar contraseña'
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className='register-password-strength'>
              <div
                id='strength-meter'
                className='register-strength-meter'
                style={{
                  width: `${Math.min(strength.width, 100)}%`,
                  backgroundColor: strength.color,
                }}
              />
            </div>
            <div id='strength-text' className='register-strength-text'>
              Seguridad: {strength.text}
            </div>
          </div>
          <div className='register-form-group'>
            <label htmlFor='confirm-password' className='register-form-label'>
              Confirmar contraseña
            </label>
            <div className='register-input-wrapper'>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id='confirm-password'
                name='confirm-password'
                className='register-form-input'
                placeholder='Confirma tu contraseña'
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
              <button
                type='button'
                className='register-toggle-password'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label='Mostrar/Ocultar confirmar contraseña'
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button
            type='submit'
            className='register-btn'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Procesando...' : 'REGISTRARSE'}
            <span className='register-btn-glow' />
          </button>

          <div className='register-separator'>
            <span>o</span>
          </div>

          <GoogleAuthButton
            text='Registrarse con Google'
            className='futuristic'
            isRegister
          />
        </form>
        <div className='register-form-footer'>
          <p className='mt-4 text-center'>
            ¿Ya tienes una cuenta?{' '}
            <Link to='/login' className='text-plubot-accent hover:underline'>
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

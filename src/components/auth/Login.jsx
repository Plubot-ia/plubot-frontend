import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import { useLogin } from '../../hooks/useLogin';

import GoogleAuthButton from './GoogleAuthButton';
import './Login.css';

const Login = () => {
  const {
    formData,
    showPassword,
    message,
    isSubmitting,
    setShowPassword,
    getContextualMessage,
    handleChange,
    handleLogin,
  } = useLogin();

  return (
    <motion.div
      className='login-login-container'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className='login-cosmic-lights'>
        <div className='login-light-beam login-light-beam-1' />
        <div className='login-light-beam login-light-beam-2' />
        <div className='login-light-beam login-light-beam-3' />
      </div>
      <div className='login-particles'>
        {['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((key, index) => (
          <div
            key={key}
            className={`login-particle login-particle-${index + 1}`}
          />
        ))}
      </div>
      <motion.div
        className='login-login-card'
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
      >
        <div className='login-card-header'>
          <div className='login-logo'>
            <img src='/logo.svg' alt='PLUBOT' />
          </div>
          <h2 className='login-card-title'>Iniciar Sesión</h2>
          <p className='login-card-subtitle'>{getContextualMessage()}</p>
        </div>
        {message.text?.length > 0 && (
          <div
            key={message.text}
            className={`login-message login-message-${message.type} login-show`}
            aria-live='polite'
          >
            {message.text}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className='login-form-group'>
            <label htmlFor='email' className='login-form-label'>
              Email
            </label>
            <input
              type='email'
              id='email'
              name='email'
              className='login-form-input'
              placeholder='correo@ejemplo.com'
              value={formData.email}
              onChange={handleChange}
              required
              aria-required='true'
            />
          </div>
          <div className='login-form-group'>
            <label htmlFor='password' className='login-form-label'>
              Contraseña
            </label>
            <div className='login-input-wrapper'>
              <input
                type={showPassword ? 'text' : 'password'}
                id='password'
                name='password'
                className='login-form-input'
                placeholder='Ingresa tu contraseña'
                value={formData.password}
                onChange={handleChange}
                required
                aria-required='true'
              />
              <button
                type='button'
                className='login-toggle-password'
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <motion.button
            type='submit'
            className='login-btn'
            disabled={isSubmitting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Entrar
          </motion.button>
        </form>

        <div className='login-separator'>
          <span className='login-separator-text'>o</span>
        </div>

        <GoogleAuthButton
          text='Iniciar sesión con Google'
          className='futuristic'
        />

        <div className='login-form-footer'>
          <p className='mt-4 text-center'>
            ¿No tienes una cuenta?{' '}
            <Link to='/register' className='text-plubot-accent hover:underline'>
              Regístrate acá
            </Link>
          </p>
          <p className='mt-2 text-center'>
            <Link
              to='/forgot-password'
              className='text-plubot-accent hover:underline text-sm'
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login;

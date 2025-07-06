import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import useAuthStore from '@/stores/use-auth-store';

import useWindowSize from '../../hooks/useWindowSize';

import GoogleAuthButton from './GoogleAuthButton';
import './Login.css';

const Login = () => {
  const { width, height } = useWindowSize();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, error: authError } = useAuthStore();

  // Efecto para manejar errores del store y mensajes de la URL
  useEffect(() => {
    if (authError) {
      setMessage({ text: authError, type: 'error' });
    }

    // Procesar parámetros de la URL
    const searchParameters = new URLSearchParams(location.search);
    const sessionExpired = searchParameters.get('session_expired');
    const urlMessage = searchParameters.get('message');

    if (sessionExpired) {
      setMessage({
        text: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
        type: 'info',
      });
    } else if (urlMessage) {
      switch (urlMessage) {
        case 'verified': {
          setMessage({
            text: '¡Correo verificado exitosamente! Ya puedes iniciar sesión.',
            type: 'success',
          });
          break;
        }
        case 'already_verified': {
          setMessage({
            text: 'Tu correo ya ha sido verificado anteriormente.',
            type: 'info',
          });
          break;
        }
        case 'password_reset': {
          setMessage({
            text: 'Contraseña restablecida exitosamente. Inicia sesión con tu nueva contraseña.',
            type: 'success',
          });
          break;
        }
        default: {
          break;
        }
      }
    }
  }, [authError, location.search]);

  // Cargar datos guardados del formulario
  useEffect(() => {
    const savedForm = localStorage.getItem('loginFormData');
    if (savedForm) {
      setFormData(JSON.parse(savedForm));
    }
  }, []);

  // Guardar datos del formulario
  useEffect(() => {
    localStorage.setItem('loginFormData', JSON.stringify(formData));
  }, [formData]);

  // Redirección tras login exitoso, solo si no hay mensaje y no está enviando
  useEffect(() => {
    if (isAuthenticated && !message.text && !isSubmitting) {
      const from = location.state?.from || '/pluniverse';
      localStorage.removeItem('loginFormData');
      navigate(from, { replace: true });
    } else if (isAuthenticated && message.text) {
      // No redirigir si hay un mensaje activo para que el usuario pueda leerlo.
    }
  }, [isAuthenticated, navigate, location.state, message.text, isSubmitting]);

  const getContextualMessage = () => {
    if (location.state?.from?.includes('/plubot/create')) {
      return 'Inicia sesión para comenzar a crear tu Plubot y desatar su poder 👾';
    }
    return 'Bienvenido de nuevo 👾';
  };

  const showMessage = (text, type) => {
    if (globalThis.messageTimer) {
      clearTimeout(globalThis.messageTimer);
    }
    setMessage({ text, type });
    setIsSubmitting(false); // Resetear isSubmitting inmediatamente
    globalThis.messageTimer = setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 5000);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));

    // Guardar el email para usarlo en la autenticación con Google
    if (name === 'email' && value) {
      localStorage.setItem('last_email_used', value);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    if (!formData.email || !formData.password) {
      showMessage('Por favor completa todos los campos', 'error');
      setIsSubmitting(false);
      return;
    }

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;    if (!emailRegex.test(formData.email)) {
      showMessage('Por favor ingresa un email válido', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      // Asegurarse de que los datos se envían correctamente estructurados
      const email = formData.email.trim();
      const { password } = formData;

      await login(email, password);

      // Si llegamos aquí, el login fue exitoso
      showMessage('¡Inicio de sesión exitoso! Redirigiendo...', 'success');

      // Efecto visual de éxito
      const card = document.querySelector('.login-login-card');
      if (card) {
        card.style.boxShadow = `
          0 0 50px rgba(0, 255, 150, 0.7),
          0 0 120px rgba(0, 0, 0, 0.8),
          inset 0 0 25px rgba(0, 255, 150, 0.4)
        `;
      }

      // Redirigir después de un breve retraso
    } finally {
      setIsSubmitting(false);
    }
  };

  // Efecto de inclinación 3D
  useEffect(() => {
    const card = document.querySelector('.login-login-card');
    const handleMouseMove = (event) => {
      if ((width || 0) > 768) {
        const xAxis = ((width || 0) / 2 - event.pageX) / 25;
        const yAxis = ((height || 0) / 2 - event.pageY) / 25;
        if (card) {
          card.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        }
      } else if (card) {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
      }
    };
    const handleMouseLeave = () => {
      if (card) {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [width, height]);

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
        {/* Mensaje dinámico */}
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

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';

import useAuthStore from '@/stores/use-auth-store';

import useWindowSize from '../../hooks/useWindowSize';

import GoogleAuthButton from './GoogleAuthButton';

import './Register.css';

const Register = () => {
  const { width } = useWindowSize();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [strength, setStrength] = useState({
    width: 0,
    color: '#333',
    text: 'Sin verificar',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register, error: authError } = useAuthStore();

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Efecto para manejar errores del store
  useEffect(() => {
    if (authError) {
      showMessage(authError, 'error');
    }
  }, [authError]);

  // Función para manejar cambios en el campo de email
  const handleEmailChange = (event) => {
    const { value } = event.target;
    setEmail(value);

    // Guardar el email para usarlo en la autenticación con Google
    if (value) {
      localStorage.setItem('last_email_used', value);
    }
  };

  const evaluatePasswordStrength = (newPassword) => {
    let strengthValue = 0;
    let feedbackText = 'Sin verificar';
    let color = '#333';

    if (newPassword.length > 0) {
      if (newPassword.length >= 8) strengthValue += 25;
      if (/[A-Z]/.test(newPassword)) strengthValue += 25;
      if (/[0-9]/.test(newPassword)) strengthValue += 25;
      if (/[^A-Za-z0-9]/.test(newPassword)) strengthValue += 25;

      if (strengthValue <= 25) {
        feedbackText = 'Débil';
        color = '#ff4747';
      } else if (strengthValue <= 50) {
        feedbackText = 'Media';
        color = '#ffa500';
      } else if (strengthValue <= 75) {
        feedbackText = 'Buena';
        color = '#2de6ac';
      } else {
        feedbackText = 'Fuerte';
        color = '#00ff96';
      }
    } else {
      strengthValue = 0;
    }

    setStrength({ width: strengthValue, color, text: feedbackText });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!name || !email || !password || !confirmPassword) {
      showMessage('Por favor completa todos los campos', 'error');
      setIsSubmitting(false);
      return;
    }

    // Guardar el email para usarlo en la autenticación con Google
    if (email) {
      localStorage.setItem('last_email_used', email);
    }

    if (password.length < 8) {
      showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
      setIsSubmitting(false);
      return;
    }

    const passwordsMatch = password === confirmPassword;
    if (!passwordsMatch) {
      showMessage('Las contraseñas no coinciden', 'error');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Por favor ingresa un email válido', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await register(name, email, password);

      if (!response) {
        showMessage(
          'Error en el registro. Respuesta inesperada del servidor.',
          'error',
        );
        setIsSubmitting(false);
        return;
      }

      if (response.success === true) {
        showMessage(
          '¡Registro exitoso! Revisa tu correo para verificar.',
          'success',
        );
        navigate('/auth/verify-email', { replace: true });
      } else {
        const errorMessage =
          response.data?.message || 'Error en el registro. Intenta nuevamente.';
        showMessage(errorMessage, 'error');
        setIsSubmitting(false);
      }
    } catch (error) {
      // EXCEPTION CASE (e.g., network error, 500 server error)
      setIsSubmitting(false);
      const errorMessage =
        error?.response?.data?.message || 'Ocurrió un error inesperado.';
      showMessage(errorMessage, 'error');
    }
  };

  const handleNavigateToLogin = () => {
    navigate('/auth/login');
  };

  useEffect(() => {
    const card = document.querySelector('.register-register-card');
    const light1 = document.querySelector('.register-light-beam-1');
    const light2 = document.querySelector('.register-light-beam-2');

    const handleMouseMove = (event) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateX = -((y / rect.height) * 2 - 1) * 10;
      const rotateY = ((x / rect.width) * 2 - 1) * 10;
      const perspective = 'perspective(1000px)';
      const rotationX = `rotateX(${rotateX}deg)`;
      const rotationY = `rotateY(${rotateY}deg)`;
      const scale = 'scale3d(1, 1, 1)';
      card.style.transform = `${perspective} ${rotationX} ${rotationY} ${scale}`;

      if (light1 && light2) {
        light1.style.transform = `translateX(${(x / width) * 50}px) rotate(45deg)`;
        light2.style.transform = `translateX(${(x / width) * 50}px) rotate(-45deg)`;
      }
    };

    const handleMouseLeave = () => {
      if (card) {
        card.style.transform =
          'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [width]);

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
                onChange={(event) => {
                  setPassword(event.target.value);
                  evaluatePasswordStrength(event.target.value);
                }}
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

Register.propTypes = {};

export default Register;

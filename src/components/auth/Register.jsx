import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import useAuthStore from '@/stores/useAuthStore';
import GoogleAuthButton from './GoogleAuthButton';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [strength, setStrength] = useState({ width: 0, color: '#333', text: 'Sin verificar' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();
  const { register, error: authError } = useAuthStore();

  // Efecto para manejar errores del store
  useEffect(() => {
    if (authError) {
      showMessage(authError, 'error');
    }
  }, [authError]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const evaluatePasswordStrength = (password) => {
    let strength = 0;
    let feedback = '';
    let color = '#333';

    if (password.length > 0) {
      if (password.length >= 8) strength += 25;
      if (password.match(/[A-Z]/)) strength += 25;
      if (password.match(/[0-9]/)) strength += 25;
      if (password.match(/[^A-Za-z0-9]/)) strength += 25;

      if (strength <= 25) {
        feedback = 'Débil';
        color = '#ff4747';
      } else if (strength <= 50) {
        feedback = 'Media';
        color = '#ffa500';
      } else if (strength <= 75) {
        feedback = 'Buena';
        color = '#2de6ac';
      } else {
        feedback = 'Fuerte';
        color = '#00ff96';
      }
    } else {
      feedback = 'Sin verificar';
      strength = 0;
    }

    setStrength({ width: strength, color, text: feedback });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, e.preventDefault called');
    setIsSubmitting(true);

    if (!name || !email || !password || !confirmPassword) {
      showMessage('Por favor completa todos los campos', 'error');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      showMessage('La contraseña debe tener al menos 8 caracteres', 'error');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
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
      if (response?.success) {
        showMessage('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.', 'success');
        setRegistrationSuccess(true);
        navigate('/email-verification-notice', { 
          state: { email }, 
          replace: true 
        });
      } else {
        showMessage('Error en el registro. Intenta nuevamente.', 'error');
        setIsSubmitting(false);
      }
    } catch (error) {
      setIsSubmitting(false);
      const errorMessage = error.message === 'El email ya está registrado'
        ? 'Este email ya está registrado. Prueba con otro.'
        : error.message || 'Error de conexión. Verifica tu conexión a internet.';
      showMessage(errorMessage, 'error');
      console.error('Registration error:', error);
    }
  };

  useEffect(() => {
    if (registrationSuccess) {
      console.log('useEffect triggered, navigating to /auth/verify-email');
      navigate('/auth/verify-email', { replace: true });
      window.scrollTo(0, 0);
    }
  }, [registrationSuccess, navigate]);

  // Depuración de recargas no deseadas
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      console.log('Page is about to reload or navigate away');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleNavigateToLogin = () => {
    console.log('Navigating to /login');
    navigate('/login');
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const card = document.querySelector('.register-register-card');
    const handleMouseMove = (e) => {
      if (window.innerWidth > 768) {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        card.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
      }
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="register-register-container">
      <div className="register-cosmic-lights">
        <div className="register-light-beam register-light-beam-1"></div>
        <div className="register-light-beam register-light-beam-2"></div>
        <div className="register-light-beam register-light-beam-3"></div>
      </div>
      <div className="register-particles">
        <div className="register-particle register-particle-1"></div>
        <div className="register-particle register-particle-2"></div>
        <div className="register-particle register-particle-3"></div>
        <div className="register-particle register-particle-4"></div>
        <div className="register-particle register-particle-5"></div>
        <div className="register-particle register-particle-6"></div>
      </div>
      <div className="register-register-card">
        <div className="register-card-header">
          <div className="register-logo">
            <img src="/logo.svg" alt="PLUBOT" />
          </div>
          <h1 className="register-card-title">CREAR CUENTA</h1>
          <p className="register-card-subtitle">Comienza a crear tu compañero digital</p>
        </div>
        {message.text && (
          <div className={`register-message register-message-${message.type} register-show`}>{message.text}</div>
        )}
        <form id="register-form" action="" onSubmit={handleSubmit}>
          <div className="register-form-group">
            <label htmlFor="name" className="register-form-label">Nombre completo</label>
            <input
              type="text"
              id="name"
              name="name"
              className="register-form-input"
              placeholder="Tu nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="register-form-group">
            <label htmlFor="email" className="register-form-label">Correo electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              className="register-form-input"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="register-form-group">
            <label htmlFor="password" className="register-form-label">Contraseña</label>
            <div className="register-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="register-form-input"
                placeholder="Crea una contraseña segura"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  evaluatePasswordStrength(e.target.value);
                }}
                required
              />
              <span
                className="register-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <div className="register-password-strength">
              <div
                id="strength-meter"
                className="register-strength-meter"
                style={{ width: `${strength.width}%`, backgroundColor: strength.color }}
              ></div>
            </div>
            <div id="strength-text" className="register-strength-text">Seguridad: {strength.text}</div>
          </div>
          <div className="register-form-group">
            <label htmlFor="confirm-password" className="register-form-label">Confirmar contraseña</label>
            <div className="register-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm-password"
                name="confirm-password"
                className="register-form-input"
                placeholder="Confirma tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span
                className="register-toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          <button type="submit" className="register-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : 'REGISTRARSE'}
            <span className="register-btn-glow"></span>
          </button>
        </form>
        
        <div className="register-separator">
          <span className="register-separator-text">o</span>
        </div>
        
        <GoogleAuthButton text="Registrarse con Google" className="futuristic" />
        
        <div className="register-form-footer">
          <p>
            ¿Ya tienes una cuenta?{' '}
            <span
              onClick={handleNavigateToLogin}
              style={{ cursor: 'pointer', color: '#00e0ff', fontWeight: 600 }}
              className="register-form-footer-link"
            >
              Iniciar sesión
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import useAuthStore from '@/stores/useAuthStore';
import GoogleAuthButton from './GoogleAuthButton';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading: authLoading, error: authError } = useAuthStore();

  // Efecto para manejar errores del store
  useEffect(() => {
    if (authError) {
      setMessage({ text: authError, type: 'error' });
    }
  }, [authError]);

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
      console.log('Redirigiendo tras login exitoso, destino:', location.state?.from || '/pluniverse');
      const from = location.state?.from || '/pluniverse';
      localStorage.removeItem('loginFormData');
      navigate(from, { replace: true });
    } else if (isAuthenticated && message.text) {
      console.log('No redirigiendo: mensaje activo:', message.text);
    }
  }, [isAuthenticated, navigate, location.state, message.text, isSubmitting]);

  const getContextualMessage = () => {
    if (location.state?.from?.includes('/plubot/create')) {
      return 'Inicia sesión para comenzar a crear tu Plubot y desatar su poder 👾';
    }
    return 'Bienvenido de nuevo 👾';
  };

  const showMessage = (text, type) => {
    console.log('Mostrando mensaje:', { text, type });
    if (window.messageTimer) {
      clearTimeout(window.messageTimer);
    }
    setMessage({ text, type });
    setIsSubmitting(false); // Resetear isSubmitting inmediatamente
    window.messageTimer = setTimeout(() => {
      setMessage({ text: '', type: '' });
      console.log('Mensaje limpiado');
    }, 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Guardar el email para usarlo en la autenticación con Google
    if (name === 'email' && value) {
      localStorage.setItem('last_email_used', value);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    if (!formData.email || !formData.password) {
      showMessage('Por favor completa todos los campos', 'error');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showMessage('Por favor ingresa un email válido', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      // Asegurarse de que los datos se envían correctamente estructurados
      const email = formData.email.trim();
      const password = formData.password;
      
      console.log('Intentando login con:', { email });
      
      await login(email, password);
      
      // Si llegamos aquí, el login fue exitoso
      showMessage('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
      
      // Efecto visual de éxito
      const card = document.querySelector('.login-login-card');
      if (card) {
        card.style.boxShadow =
          '0 0 50px rgba(0, 255, 150, 0.7), 0 0 120px rgba(0, 0, 0, 0.8), inset 0 0 25px rgba(0, 255, 150, 0.4)';
      }
      
      // Redirigir después de un breve retraso
      setTimeout(() => {
        localStorage.removeItem('loginFormData');
        const from = location.state?.from || '/pluniverse';
        navigate(from, { replace: true });
      }, 1500);
      
    } catch (error) {
      // El error ya es manejado por el store y el efecto que escucha authError
      console.error('Error en login:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
    window.scrollTo(0, 0);
  };

  const handleNavigateToForgotPassword = () => {
    navigate('/forgot-password');
    window.scrollTo(0, 0);
  };

  // Efecto de inclinación 3D
  useEffect(() => {
    const card = document.querySelector('.login-login-card');
    const handleMouseMove = (e) => {
      if (window.innerWidth > 768) {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        if (card) {
          card.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        }
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
  }, []);

  return (
    <motion.div
      className="login-login-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="login-cosmic-lights">
        <div className="login-light-beam login-light-beam-1"></div>
        <div className="login-light-beam login-light-beam-2"></div>
        <div className="login-light-beam login-light-beam-3"></div>
      </div>
      <div className="login-particles">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`login-particle login-particle-${i + 1}`}></div>
        ))}
      </div>
      <motion.div
        className="login-login-card"
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
      >
        <div className="login-card-header">
          <div className="login-logo">
            <img src="/logo.svg" alt="PLUBOT" />
          </div>
          <h2 className="login-card-title">Iniciar Sesión</h2>
          <p className="login-card-subtitle">{getContextualMessage()}</p>
        </div>
        {/* Mensaje dinámico */}
        {message.text?.length > 0 && (
          <div
            key={message.text}
            className={`login-message login-message-${message.type} login-show`}
            aria-live="polite"
          >
            {message.text}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="login-form-group">
            <label htmlFor="email" className="login-form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="login-form-input"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
              aria-required="true"
            />
          </div>
          <div className="login-form-group">
            <label htmlFor="password" className="login-form-label">
              Contraseña
            </label>
            <div className="login-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="login-form-input"
                placeholder="Ingresa tu contraseña"
                value={formData.password}
                onChange={handleChange}
                required
                aria-required="true"
              />
              <span
                className="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          <motion.button
            type="submit"
            className="login-btn"
            disabled={isSubmitting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Entrar
          </motion.button>
        </form>
        
        <div className="login-separator">
          <span className="login-separator-text">o</span>
        </div>
        
        <GoogleAuthButton text="Iniciar sesión con Google" className="futuristic" />
        
        <div className="login-form-footer">
          <p>
            ¿No tenés cuenta?{' '}
            <a href="#" onClick={handleNavigateToRegister}>
              Registrate acá
            </a>
          </p>
          <p>
            ¿Olvidaste tu contraseña?{' '}
            <a href="#" onClick={handleNavigateToForgotPassword}>
              Recuperar contraseña
            </a>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login;
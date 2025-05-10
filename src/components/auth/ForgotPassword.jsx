import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    if (!email) {
      showMessage('Por favor ingresa tu correo electrónico', 'error');
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
      const formData = new FormData();
      formData.append('email', email);
      const response = await axiosInstance.post('/api/auth/forgot_password', formData);
  
      if (response.data.status === 'success') {
        showMessage('Correo de restablecimiento enviado. Revisa tu bandeja de entrada.', 'success');
        const card = document.querySelector('.forgot-password-card');
        if (card) {
          card.style.boxShadow =
            '0 0 50px rgba(0, 255, 150, 0.7), 0 0 120px rgba(0, 0, 0, 0.8), inset 0 0 25px rgba(0, 255, 150, 0.4)';
        }
        setTimeout(() => {
          navigate('/auth/login');
          window.scrollTo(0, 0);
        }, 3000);
      } else {
        showMessage(response.data.message || 'Error al enviar el correo. Intenta nuevamente.', 'error');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.message || 'Error de conexión. Verifica tu conexión a internet.';
      showMessage(errorMessage, 'error');
      setIsSubmitting(false);
    }
  };

  const handleNavigateToLogin = () => {
    navigate('/auth/login');
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const card = document.querySelector('.forgot-password-card');
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
    <div className="forgot-password-container">
      <div className="forgot-password-cosmic-lights">
        <div className="forgot-password-light-beam forgot-password-light-beam-1"></div>
        <div className="forgot-password-light-beam forgot-password-light-beam-2"></div>
        <div className="forgot-password-light-beam forgot-password-light-beam-3"></div>
      </div>
      <div className="forgot-password-particles">
        <div className="forgot-password-particle forgot-password-particle-1"></div>
        <div className="forgot-password-particle forgot-password-particle-2"></div>
        <div className="forgot-password-particle forgot-password-particle-3"></div>
        <div className="forgot-password-particle forgot-password-particle-4"></div>
        <div className="forgot-password-particle forgot-password-particle-5"></div>
        <div className="forgot-password-particle forgot-password-particle-6"></div>
      </div>
      <div className="forgot-password-card">
        <div className="forgot-password-card-header">
          <div className="forgot-password-logo">
            <img src="/logo.svg" alt="PLUBOT" />
          </div>
          <h2 className="forgot-password-card-title">Recuperar Contraseña</h2>
          <p className="forgot-password-card-subtitle">Ingresa tu email para recibir un enlace de restablecimiento 📧</p>
        </div>
        {message.text && (
          <div className={`forgot-password-message forgot-password-message-${message.type} forgot-password-show`}>{message.text}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="forgot-password-form-group">
            <label className="forgot-password-form-label" htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              className="forgot-password-form-input"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="forgot-password-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar Enlace'}
          </button>
        </form>
        <div className="forgot-password-form-footer">
          <p>
            ¿Recordaste tu contraseña?{' '}
            <span
              onClick={handleNavigateToLogin}
              style={{ cursor: 'pointer', color: '#00e0ff', fontWeight: 600 }}
              className="forgot-password-form-footer-link"
            >
              Iniciar sesión
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
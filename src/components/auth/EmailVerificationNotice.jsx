import { motion } from 'framer-motion';
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import useWindowSize from '../../hooks/useWindowSize';

import './EmailVerificationNotice.css';
import useAuthStore from '@/stores/useAuthStore';

const EmailVerificationNotice = () => {
  const { width, height } = useWindowSize();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const email = location.state?.email || user?.email || 'tu correo';

  const handleNavigateToLogin = () => {
    navigate('/login');
    window.scrollTo(0, 0);
  };

  // Efecto de rotación 3D al mover el mouse
  useEffect(() => {
    const card = document.querySelector('.email-verification-card');
    const handleMouseMove = (e) => {
      if ((width || 0) > 768) {
        const xAxis = ((width || 0) / 2 - e.pageX) / 25;
        const yAxis = ((height || 0) / 2 - e.pageY) / 25;
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

  // Redirección automática después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
      window.scrollTo(0, 0);
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div
      className="email-verification-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="email-verification-cosmic-lights">
        <div className="email-verification-light-beam email-verification-light-beam-1" />
        <div className="email-verification-light-beam email-verification-light-beam-2" />
        <div className="email-verification-light-beam email-verification-light-beam-3" />
      </div>
      <div className="email-verification-particles">
        <div className="email-verification-particle email-verification-particle-1" />
        <div className="email-verification-particle email-verification-particle-2" />
        <div className="email-verification-particle email-verification-particle-3" />
        <div className="email-verification-particle email-verification-particle-4" />
        <div className="email-verification-particle email-verification-particle-5" />
        <div className="email-verification-particle email-verification-particle-6" />
      </div>
      <motion.div
        className="email-verification-card"
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
      >
        <div className="email-verification-card-header">
          <div className="email-verification-logo">
            <img src="/logo.svg" alt="PLUBOT" />
          </div>
          <h2 className="email-verification-card-title">¡Gracias por registrarte!</h2>
          <p className="email-verification-card-subtitle">
            Te hemos enviado un correo {user?.email ? `a ${user.email}` : ''} para verificar tu cuenta. Por favor, revisa tu bandeja de entrada (o spam) y haz clic en el enlace para activar tu cuenta. Serás redirigido al inicio de sesión en 10 segundos.
          </p>
        </div>
        <button
          className="email-verification-btn"
          onClick={handleNavigateToLogin}
          aria-label="Ir a la página de inicio de sesión"
        >
          Ir a Iniciar Sesión
          <span className="email-verification-btn-glow" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default EmailVerificationNotice;
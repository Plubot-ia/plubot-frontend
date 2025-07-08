import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import useAuthStore from '@/stores/use-auth-store';

import useWindowSize from './useWindowSize';

const LAST_EMAIL_USED_KEY = 'last_email_used';

export const useLogin = () => {
  const { width, height } = useWindowSize();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, error: authError } = useAuthStore();
  const { t: translation } = useTranslation();

  const showMessage = useCallback((text, type) => {
    if (globalThis.messageTimer) {
      clearTimeout(globalThis.messageTimer);
    }
    setMessage({ text, type });
    setIsSubmitting(false);
    globalThis.messageTimer = setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 5000);
  }, []);

  useEffect(() => {
    if (authError) {
      showMessage(authError, 'error');
    }
  }, [authError, showMessage]);

  useEffect(() => {
    const searchParameters = new URLSearchParams(location.search);
    const sessionExpired = searchParameters.get('session_expired');
    const urlMessage = searchParameters.get('message');

    if (sessionExpired) {
      showMessage(translation('sessionExpired'), 'info');
    } else if (urlMessage) {
      const messageMap = {
        verified: { text: translation('emailVerified'), type: 'success' },
        already_verified: {
          text: translation('alreadyVerified'),
          type: 'info',
        },
        password_reset: {
          text: translation('passwordResetSuccess'),
          type: 'success',
        },
      };
      if (messageMap[urlMessage]) {
        showMessage(messageMap[urlMessage].text, messageMap[urlMessage].type);
      }
    }
  }, [location.search, translation, showMessage]);

  useEffect(() => {
    if (isAuthenticated && !isSubmitting) {
      const from = location.state?.from || '/pluniverse';
      localStorage.removeItem(LAST_EMAIL_USED_KEY);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state, isSubmitting]);

  const getContextualMessage = useCallback(() => {
    if (location.state?.from?.includes('/plubot/create')) {
      return 'Inicia sesión para comenzar a crear tu Plubot y desatar su poder ';
    }
    return 'Bienvenido de nuevo ';
  }, [location.state?.from]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (name === 'email' && value) {
      localStorage.setItem(LAST_EMAIL_USED_KEY, value);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    if (!formData.email || !formData.password) {
      showMessage(translation('fillAllFields'), 'error');
      return;
    }

    const emailRegex = /[^\s@]{1,64}@[^\s@]{1,255}\.[a-zA-Z]{2,63}$/;
    if (!emailRegex.test(formData.email)) {
      showMessage(translation('invalidEmail'), 'error');
      return;
    }

    try {
      await login(formData.email.trim(), formData.password);
      showMessage('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const card = document.querySelector('.login-login-card');
    if (!card) return;

    const handleMouseMove = (mouseEvent) => {
      if (width > 768) {
        const xAxis = (width / 2 - mouseEvent.pageX) / 25;
        const yAxis = (height / 2 - mouseEvent.pageY) / 25;
        card.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
      }
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    };

    if (width > 768) {
      document.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    } else {
      handleMouseLeave(); // Reset on smaller screens
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [width, height]);

  return {
    formData,
    showPassword,
    message,
    isSubmitting,
    setShowPassword,
    getContextualMessage,
    handleChange,
    handleLogin,
  };
};

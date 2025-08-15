import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import useAuthStore from '@/stores/use-auth-store';

import { useLoginCardEffect } from './useLoginCardEffect';
import { useLoginForm } from './useLoginForm';
import { useLoginMessages } from './useLoginMessages';

const LAST_EMAIL_USED_KEY = 'last_email_used';

export const useLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, error: authError, resendVerificationEmail } = useAuthStore();

  const { message, showMessage } = useLoginMessages(authError);
  const { formData, isSubmitting, handleChange, handleLogin, handleResendVerification } =
    useLoginForm({
      login,
      resendVerificationEmail,
      showMessage,
    });

  useLoginCardEffect();

  useEffect(() => {
    if (isAuthenticated && !isSubmitting) {
      const from = location.state?.from ?? '/pluniverse';
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

  return {
    formData,
    showPassword,
    message,
    isSubmitting,
    setShowPassword,
    getContextualMessage,
    handleChange,
    handleLogin,
    handleResendVerification,
  };
};

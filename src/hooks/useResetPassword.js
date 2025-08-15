import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import useAuthStore from '@/stores/use-auth-store';

const initialState = {
  newPassword: '',
  confirmPassword: '',
  showNewPassword: false,
  showConfirmPassword: false,
  message: { text: '', type: '' },
  isSubmitting: false,
};

const validatePasswords = (passwords, showMessage) => {
  if (passwords.newPassword !== passwords.confirmPassword) {
    showMessage('Las contraseñas no coinciden', 'error');
    return false;
  }
  if (passwords.newPassword.length < 8) {
    showMessage('La nueva contraseña debe tener al menos 8 caracteres', 'error');
    return false;
  }
  return true;
};

const handleSuccess = (showMessage, cardRef, handleNavigateToLogin) => {
  showMessage('Contraseña restablecida exitosamente. Redirigiendo...', 'success');
  if (cardRef.current) {
    cardRef.current.style.boxShadow = [
      '0 0 50px rgba(0, 255, 150, 0.7)',
      '0 0 120px rgba(0, 0, 0, 0.8)',
      'inset 0 0 25px rgba(0, 255, 150, 0.4)',
    ].join(', ');
  }
  setTimeout(handleNavigateToLogin, 3000);
};

const handleError = (error, showMessage) => {
  const errorMessage = error.response?.data?.message ?? 'Error de conexión.';
  showMessage(errorMessage, 'error');
};

export const useResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, error: authError } = useAuthStore();
  const [state, setState] = useState(initialState);
  const cardRef = useRef(null);

  const showMessage = (text, type) => {
    setState((previousState) => ({
      ...previousState,
      message: { text, type },
    }));
    setTimeout(
      () =>
        setState((previousState) => ({
          ...previousState,
          message: { text: '', type: '' },
        })),
      5000,
    );
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (authError) showMessage(authError, 'error');
  }, [authError]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validatePasswords(state, showMessage)) return;

    setState((previousState) => ({ ...previousState, isSubmitting: true }));
    try {
      const response = await resetPassword(token, state.newPassword);
      if (response?.success) {
        handleSuccess(showMessage, cardRef, handleNavigateToLogin);
      } else {
        showMessage(response?.message ?? 'Error al restablecer la contraseña.', 'error');
      }
    } catch (error) {
      handleError(error, showMessage);
    } finally {
      setState((previousState) => ({ ...previousState, isSubmitting: false }));
    }
  };

  const setPassword = (field, value) => {
    setState((previousState) => ({ ...previousState, [field]: value }));
  };

  return {
    ...state,
    cardRef,
    setNewPassword: (value) => setPassword('newPassword', value),
    setConfirmPassword: (value) => setPassword('confirmPassword', value),
    setShowNewPassword: (value) => setPassword('showNewPassword', value),
    setShowConfirmPassword: (value) => setPassword('showConfirmPassword', value),
    handleSubmit,
    handleNavigateToLogin,
  };
};

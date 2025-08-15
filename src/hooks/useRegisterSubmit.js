import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import useAuthStore from '@/stores/use-auth-store';

import { validateRegistrationForm, secureCompare } from '../utils/auth-helpers';

export const useRegisterSubmit = (formState, showMessage) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { name, email, password, confirmPassword } = formState;

    const validation = validateRegistrationForm({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!secureCompare(password, confirmPassword)) {
      showMessage('Las contraseñas no coinciden.', 'error');
      return;
    }

    if (!validation.isValid) {
      showMessage(validation.message, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      showMessage('¡Registro exitoso! Revisa tu correo para verificar.', 'success');
      navigate('/auth/verify-email', { replace: true });
    } catch (error) {
      const errorMessage = error.message || 'Ocurrió un error inesperado.';
      showMessage(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleSubmit };
};

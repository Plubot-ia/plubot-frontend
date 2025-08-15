import { useState } from 'react';

import useAuthStore from '../stores/use-auth-store';

export const useResendVerification = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resendVerificationEmail = useAuthStore((state) => state.resendVerificationEmail);

  const getContextualMessage = () => {
    if (message.type === 'success') {
      return '¡Revisa tu bandeja de entrada!';
    }
    return 'Ingresa tu email para reenviar el enlace de verificación.';
  };

  const handleResend = async (event) => {
    event.preventDefault();
    if (!email) {
      setMessage({
        text: 'Por favor, ingresa tu correo electrónico.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await resendVerificationEmail(email);
      setMessage({ text: response.message, type: 'success' });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Ocurrió un error al reenviar el correo.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    email,
    message,
    isSubmitting,
    setEmail,
    handleResend,
    getContextualMessage,
  };
};

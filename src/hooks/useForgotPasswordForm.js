import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import useAuthStore from '@/stores/use-auth-store';

const useForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { forgotPassword, error: authError } = useAuthStore();

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  }, []);

  useEffect(() => {
    if (authError) {
      showMessage(authError, 'error');
    }
  }, [authError, showMessage]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!email) {
      showMessage('Por favor ingresa tu correo electrónico', 'error');
      setIsSubmitting(false);
      return;
    }

    // Regex más segura y eficiente para evitar ataques ReDoS.
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      showMessage('Por favor ingresa un email válido', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await forgotPassword(email);

      if (response?.success) {
        showMessage('Correo de restablecimiento enviado. Revisa tu bandeja de entrada.', 'success');
        setTimeout(() => {
          navigate('/login');
          window.scrollTo(0, 0);
        }, 3000);
      } else {
        showMessage('Error al enviar el correo. Intenta nuevamente.', 'error');
        setIsSubmitting(false);
      }
    } catch (submissionError) {
      const errorMessage =
        submissionError.response?.data?.message ||
        'Error de conexión. Verifica tu conexión a internet.';
      showMessage(errorMessage, 'error');
      setIsSubmitting(false);
    }
  };

  return {
    email,
    setEmail,
    message,
    isSubmitting,
    handleSubmit,
  };
};

export default useForgotPasswordForm;

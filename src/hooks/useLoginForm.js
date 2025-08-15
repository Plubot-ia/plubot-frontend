import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LAST_EMAIL_USED_KEY = 'last_email_used';

export const useLoginForm = ({ login, resendVerificationEmail, showMessage }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t: translation } = useTranslation();

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

    if (!formData.email || !formData.password) {
      showMessage(translation('fillAllFields'), 'error');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /[^\s@]{1,64}@[^\s@]{1,255}\.[a-zA-Z]{2,63}$/;
    if (!emailRegex.test(formData.email)) {
      showMessage(translation('invalidEmail'), 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      await login(formData.email.trim(), formData.password);
      showMessage('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      showMessage('Por favor, ingresa tu email para reenviar la verificación.', 'error');
      return;
    }
    try {
      const response = await resendVerificationEmail(formData.email);
      showMessage(response.message, 'success');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  return {
    formData,
    isSubmitting,
    handleChange,
    handleLogin,
    handleResendVerification,
  };
};

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import useAuthStore from '@/stores/use-auth-store';

/**
 * Hook personalizado para gestionar la lógica del formulario de cambio de contraseña.
 * Encapsula el estado, la validación y la comunicación con el store de autenticación.
 */
const usePasswordForm = () => {
  const navigate = useNavigate();
  const { changePassword, authError } = useAuthStore();

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efecto para mostrar errores provenientes del store de autenticación
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handlePasswordChange = (event) => {
    // Limpiar mensajes al empezar a editar para mejorar la UX
    if (error) setError('');
    if (successMessage) setSuccessMessage('');

    const { name, value } = event.target;
    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setError('Todos los campos son obligatorios.');
      setIsSubmitting(false);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      setIsSubmitting(false);
      return;
    }

    try {
      await changePassword(passwords.currentPassword, passwords.newPassword);
      setSuccessMessage('Contraseña actualizada con éxito.');
      setTimeout(() => navigate('/profile'), 2000); // Redirigir a un lugar más apropiado
    } catch {
      // El error de la API ya se gestiona a través del estado `authError`
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    passwords,
    error,
    successMessage,
    isSubmitting,
    handlePasswordChange,
    handleSubmit,
  };
};

export default usePasswordForm;

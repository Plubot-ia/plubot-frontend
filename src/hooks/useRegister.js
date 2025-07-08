import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import useAuthStore from '@/stores/use-auth-store';

import {
  evaluatePasswordStrength,
  validateRegistrationForm,
} from '../utils/auth-helpers';

import useWindowSize from './useWindowSize';

const useRegister = () => {
  const { width } = useWindowSize();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [strength, setStrength] = useState({
    width: 0,
    color: '#333',
    text: 'Sin verificar',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register, error: authError } = useAuthStore();

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  }, []);

  useEffect(() => {
    if (authError) {
      showMessage(authError, 'error');
    }
  }, [authError, showMessage]);

  const handleEmailChange = (event) => {
    const { value } = event.target;
    setEmail(value);
    if (value) {
      localStorage.setItem('last_email_used', value);
    }
  };

  const handlePasswordChange = (event) => {
    const newPassword = event.target.value;
    setPassword(newPassword);
    setStrength(evaluatePasswordStrength(newPassword));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const validation = validateRegistrationForm({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.isValid) {
      showMessage(validation.message, 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await register(name, email, password);

      if (response?.success) {
        showMessage(
          '¡Registro exitoso! Revisa tu correo para verificar.',
          'success',
        );
        navigate('/auth/verify-email', { replace: true });
      } else {
        const errorMessage =
          response?.data?.message ||
          'Error en el registro. Intenta nuevamente.';
        showMessage(errorMessage, 'error');
        setIsSubmitting(false);
      }
    } catch (error) {
      setIsSubmitting(false);
      const errorMessage =
        error?.response?.data?.message || 'Ocurrió un error inesperado.';
      showMessage(errorMessage, 'error');
    }
  };

  useEffect(() => {
    const card = document.querySelector('.register-register-card');
    const light1 = document.querySelector('.register-light-beam-1');
    const light2 = document.querySelector('.register-light-beam-2');

    const handleMouseMove = (event) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateX = -((y / rect.height) * 2 - 1) * 10;
      const rotateY = ((x / rect.width) * 2 - 1) * 10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`;

      if (light1 && light2) {
        light1.style.transform = `translateX(${(x / width) * 50}px) rotate(45deg)`;
        light2.style.transform = `translateX(${(x / width) * 50}px) rotate(-45deg)`;
      }
    };

    const handleMouseLeave = () => {
      if (card) {
        card.style.transform =
          'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [width]);

  return {
    name,
    setName,
    email,
    password,
    confirmPassword,
    setConfirmPassword,
    message,
    strength,
    isSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  };
};

export default useRegister;

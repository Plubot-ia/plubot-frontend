import { useState } from 'react';

import { useRegisterCardEffect } from './useRegisterCardEffect';
import { useRegisterFeedback } from './useRegisterFeedback';
import { useRegisterForm } from './useRegisterForm';
import { useRegisterSubmit } from './useRegisterSubmit';

const useRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    name,
    setName,
    email,
    handleEmailChange,
    password,
    handlePasswordChange,
    confirmPassword,
    setConfirmPassword,
    strength,
  } = useRegisterForm();

  const { message, passwordMatch, showMessage } = useRegisterFeedback(password, confirmPassword);

  const { isSubmitting, handleSubmit } = useRegisterSubmit(
    { name, email, password, confirmPassword },
    showMessage,
  );

  useRegisterCardEffect();

  return {
    name,
    setName,
    email,
    handleEmailChange,
    password,
    handlePasswordChange,
    confirmPassword,
    setConfirmPassword,
    message,
    strength,
    isSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordMatch,
    handleSubmit,
  };
};

export default useRegister;

import { useState } from 'react';

import { evaluatePasswordStrength } from '../utils/auth-helpers';

export const useRegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [strength, setStrength] = useState({
    width: 0,
    color: '#333',
    text: 'Sin verificar',
  });

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

  return {
    name,
    setName,
    email,
    handleEmailChange,
    password,
    handlePasswordChange,
    confirmPassword,
    setConfirmPassword,
    strength,
  };
};

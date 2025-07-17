import { useState, useEffect, useCallback } from 'react';

import { secureCompare } from '../utils/auth-helpers';

export const useRegisterFeedback = (password, confirmPassword) => {
  const [message, setMessage] = useState({ text: '', type: '' });
  const [passwordMatch, setPasswordMatch] = useState({ text: '', type: '' });

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  }, []);

  useEffect(() => {
    if (password && confirmPassword) {
      if (secureCompare(password, confirmPassword)) {
        setPasswordMatch({
          text: 'Las contraseñas coinciden.',
          type: 'success',
        });
      } else {
        setPasswordMatch({
          text: 'Las contraseñas no coinciden.',
          type: 'error',
        });
      }
    } else {
      setPasswordMatch({ text: '', type: '' });
    }
  }, [password, confirmPassword]);

  return { message, passwordMatch, showMessage };
};

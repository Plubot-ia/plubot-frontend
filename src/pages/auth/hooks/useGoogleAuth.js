import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { processAuthentication } from '../services/auth-service';

const useGoogleAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Procesando autenticación...');

  const handleAuthSuccess = useCallback(
    (successMessage) => {
      setStatus('success');
      setMessage(successMessage);
      setTimeout(() => navigate('/pluniverse'), 1500);
    },
    [navigate],
  );

  const handleAuthError = useCallback(
    (errorMessage) => {
      setStatus('error');
      setMessage(errorMessage);
      setTimeout(() => navigate('/login'), 3000);
    },
    [navigate],
  );

  useEffect(() => {
    processAuthentication(location, handleAuthSuccess, handleAuthError);
  }, [location, handleAuthSuccess, handleAuthError]);

  return { status, message };
};

export default useGoogleAuth;

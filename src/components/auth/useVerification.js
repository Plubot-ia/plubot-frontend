import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import useAuthStore from '@/stores/use-auth-store';

export const useVerification = (token, userEmail) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { verifyEmail, resendVerificationEmail } = useAuthStore();

  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, verifying, success, error
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isResending, setIsResending] = useState(false);

  const showMessage = useCallback((text, type) => {
    setMessage({ text, type });
    const timer = setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (token) {
      const performVerification = async () => {
        setVerificationStatus('verifying');
        try {
          const result = await verifyEmail(token);
          showMessage(result.message, 'success');
          setVerificationStatus('success');
          setTimeout(() => navigate('/login?message=verified'), 3000);
        } catch (error) {
          const errorMessage = error.message || t('auth.errorMessages.verificationFailed');
          showMessage(errorMessage, 'error');
          setVerificationStatus('error');
        }
      };
      performVerification();
    }
  }, [token, verifyEmail, navigate, t, showMessage]);

  const handleResendEmail = async () => {
    if (!userEmail) {
      showMessage(t('auth.errorMessages.emailNotFound'), 'error');
      return;
    }
    setIsResending(true);
    try {
      await resendVerificationEmail(userEmail);
      showMessage(t('auth.successMessages.emailResent'), 'success');
    } catch (error) {
      const errorMessage = error.message || t('auth.errorMessages.resendFailed');
      showMessage(errorMessage, 'error');
    } finally {
      setIsResending(false);
    }
  };

  return { verificationStatus, message, isResending, handleResendEmail };
};

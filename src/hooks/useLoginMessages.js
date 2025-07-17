import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export const useLoginMessages = (authError) => {
  const [message, setMessage] = useState({ text: '', type: '' });
  const location = useLocation();
  const { t: translation } = useTranslation();

  const showMessage = useCallback((text, type) => {
    if (globalThis.messageTimer) {
      clearTimeout(globalThis.messageTimer);
    }
    setMessage({ text, type });
    globalThis.messageTimer = setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 5000);
  }, []);

  useEffect(() => {
    if (authError) {
      showMessage(authError, 'error');
    }
  }, [authError, showMessage]);

  useEffect(() => {
    const searchParameters = new URLSearchParams(location.search);
    const sessionExpired = searchParameters.get('session_expired');
    const urlMessage = searchParameters.get('message');

    if (sessionExpired) {
      showMessage(translation('sessionExpired'), 'info');
    } else if (urlMessage) {
      switch (urlMessage) {
        case 'verified': {
          showMessage(translation('emailVerified'), 'success');
          break;
        }
        case 'already_verified': {
          showMessage(translation('alreadyVerified'), 'info');
          break;
        }
        case 'password_reset': {
          showMessage(translation('passwordResetSuccess'), 'success');
          break;
        }
        default: {
          break;
        }
      }
    }
  }, [location.search, translation, showMessage]);

  return { message, showMessage };
};

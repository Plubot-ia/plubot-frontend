import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { useVerification } from './useVerification';
import './EmailVerificationNotice.css';
import VerificationActions from './VerificationActions';
import VerificationHeader from './VerificationHeader';
import VerificationMessage from './VerificationMessage';

const EmailVerificationNotice = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams();

  const [userEmail, setUserEmail] = useState('');
  const { verificationStatus, message, isResending, handleResendEmail } = useVerification(
    token,
    userEmail,
  );

  useEffect(() => {
    const lastEmail = localStorage.getItem('last_email_used');
    if (lastEmail) {
      setUserEmail(lastEmail);
    }
  }, []);

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const getVerificationTitle = () => {
    if (!token) {
      return t('auth.thankYouForRegistering');
    }
    switch (verificationStatus) {
      case 'verifying': {
        return t('auth.verifyingEmail');
      }
      case 'success': {
        return t('auth.emailVerified');
      }
      case 'error': {
        return t('auth.verificationFailed');
      }
      default: {
        return t('auth.thankYouForRegistering');
      }
    }
  };

  return (
    <motion.div
      className='notice-container'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <motion.div
        className='notice-card'
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
      >
        <VerificationHeader
          title={getVerificationTitle()}
          subtitle={token ? '' : t('auth.verificationEmailSent', { email: userEmail })}
        />

        <VerificationMessage message={message} />

        <VerificationActions
          status={verificationStatus}
          onNavigate={handleNavigateToLogin}
          onResend={handleResendEmail}
          isResending={isResending}
          t={t}
        />

        <p className='notice-info'>{t('auth.spamHint')}</p>
      </motion.div>
    </motion.div>
  );
};

export default EmailVerificationNotice;

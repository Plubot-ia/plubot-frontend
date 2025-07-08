import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import useAuthStore from '@/stores/use-auth-store';

import useCardTiltEffect from '../../hooks/useCardTiltEffect';

import './EmailVerificationNotice.css';

const EmailVerificationNotice = () => {
  const { t: translation } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const cardRef = useCardTiltEffect();

  const handleNavigateToLogin = () => {
    navigate('/login');
    window.scrollTo(0, 0);
  };

  // Redirección automática después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
      window.scrollTo(0, 0);
    }, 10_000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div
      className='email-verification-container'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className='email-verification-cosmic-lights'>
        <div className='email-verification-light-beam email-verification-light-beam-1' />
        <div className='email-verification-light-beam email-verification-light-beam-2' />
        <div className='email-verification-light-beam email-verification-light-beam-3' />
      </div>
      <div className='email-verification-particles'>
        <div className='email-verification-particle email-verification-particle-1' />
        <div className='email-verification-particle email-verification-particle-2' />
        <div className='email-verification-particle email-verification-particle-3' />
        <div className='email-verification-particle email-verification-particle-4' />
        <div className='email-verification-particle email-verification-particle-5' />
        <div className='email-verification-particle email-verification-particle-6' />
      </div>
      <motion.div
        ref={cardRef}
        className='email-verification-card'
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
      >
        <div className='email-verification-card-header'>
          <div className='email-verification-logo'>
            <img src='/logo.svg' alt='PLUBOT' />
          </div>
          <h2 className='email-verification-card-title'>
            {translation('thankYouForRegistering')}
          </h2>
          <p className='email-verification-card-subtitle'>
            {translation('verificationEmailSent', { email: user?.email })}
          </p>
        </div>
        <button
          type='button'
          className='email-verification-button'
          onClick={handleNavigateToLogin}
        >
          {translation('goToLogin')}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default EmailVerificationNotice;

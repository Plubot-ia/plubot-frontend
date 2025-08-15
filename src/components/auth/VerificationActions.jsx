import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';

const VerificationActions = ({ status, onNavigate, onResend, isResending, t }) => {
  if (status === 'verifying') {
    // eslint-disable-next-line unicorn/no-null
    return null;
  }

  return (
    <div className='notice-actions'>
      <motion.button
        type='button'
        className='notice-btn primary'
        onClick={onNavigate}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {t('auth.goToLogin')}
      </motion.button>
      <motion.button
        type='button'
        className='notice-btn secondary'
        onClick={onResend}
        disabled={isResending}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isResending ? t('auth.resending') : t('auth.resendEmail')}
      </motion.button>
    </div>
  );
};

VerificationActions.propTypes = {
  status: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onResend: PropTypes.func.isRequired,
  isResending: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
};

export default VerificationActions;

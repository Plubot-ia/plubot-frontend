import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { iconVariants } from '../utils/auth-animations';

const LoadingSpinner = () => (
  <div className='loading-spinner'>
    <div className='spinner-inner' />
  </div>
);

const SuccessIcon = () => (
  <svg viewBox='0 0 24 24' className='success-icon'>
    <motion.path
      d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    />
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox='0 0 24 24' className='error-icon'>
    <motion.path
      d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    />
  </svg>
);

const AuthStatusIcon = ({ status }) => (
  <motion.div className={`status-icon ${status}`} variants={iconVariants}>
    {status === 'loading' && <LoadingSpinner />}
    {status === 'success' && <SuccessIcon />}
    {status === 'error' && <ErrorIcon />}
  </motion.div>
);

AuthStatusIcon.propTypes = {
  status: PropTypes.oneOf(['loading', 'success', 'error']).isRequired,
};

export default AuthStatusIcon;

import { motion } from 'framer-motion';

import AuthStatusCard from './components/AuthStatusCard';
import useGoogleAuth from './hooks/useGoogleAuth';
import { containerVariants } from './utils/auth-animations';

import './GoogleAuthCallback.css';

const GoogleAuthCallback = () => {
  const { status, message } = useGoogleAuth();

  return (
    <motion.div
      className='google-auth-callback-container'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      <AuthStatusCard status={status} message={message} />
    </motion.div>
  );
};

export default GoogleAuthCallback;

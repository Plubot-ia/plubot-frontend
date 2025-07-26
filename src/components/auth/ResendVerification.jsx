import { motion } from 'framer-motion';

import { useResendVerification } from '../../hooks/useResendVerification';

import ResendBackground from './ResendBackground';
import ResendCard from './ResendCard';
import './ResendVerification.css';

const ResendVerification = () => {
  const resendProps = useResendVerification();

  return (
    <motion.div
      className='resend-container'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <ResendBackground />
      <ResendCard {...resendProps} />
    </motion.div>
  );
};

export default ResendVerification;

import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import { cardVariants, textVariants } from '../utils/auth-animations';

import AuthStatusIcon from './AuthStatusIcon';

const getStatusTitle = (status) => {
  switch (status) {
    case 'loading': {
      return 'Procesando';
    }
    case 'success': {
      return '¡Éxito!';
    }
    case 'error': {
      return 'Error';
    }
    default: {
      return '';
    }
  }
};

const AuthStatusCard = ({ status, message }) => {
  const navigate = useNavigate();

  return (
    <motion.div className='google-auth-callback-card' variants={cardVariants}>
      <AuthStatusIcon status={status} />
      <motion.h2
        className={`status-title ${status}`}
        variants={textVariants}
        transition={{ delay: 0.6 }}
      >
        {getStatusTitle(status)}
      </motion.h2>
      <motion.p
        className='status-message'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {message}
      </motion.p>

      {status === 'error' && (
        <motion.button
          className='retry-button'
          onClick={() => navigate('/login')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Volver al inicio de sesión
        </motion.button>
      )}
    </motion.div>
  );
};

AuthStatusCard.propTypes = {
  status: PropTypes.oneOf(['loading', 'success', 'error']).isRequired,
  message: PropTypes.string.isRequired,
};

export default AuthStatusCard;

import { motion } from 'framer-motion';
import { Copy } from 'lucide-react';
import PropTypes from 'prop-types';

const ChallengeCard = ({ challenge }) => (
  <motion.div
    className='challenge-card'
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className='challenge-card-content'>
      <h3 className='challenge-card-title'>{challenge.title}</h3>
      <p className='challenge-card-description'>{challenge.description}</p>
      <div className='challenge-card-reward'>
        <span>Recompensa:</span> {challenge.reward}
      </div>
      <div className='challenge-card-progress'>
        <div className='progress-bar' style={{ width: `${challenge.progress}%` }} />
      </div>
      <div className='challenge-card-footer'>
        <span>Finaliza en: {challenge.deadline}</span>
        <button className='copy-button' type='button'>
          <Copy size={14} />
          <span>Compartir Reto</span>
        </button>
      </div>
    </div>
  </motion.div>
);

ChallengeCard.propTypes = {
  challenge: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    reward: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    deadline: PropTypes.string.isRequired,
  }).isRequired,
};

export default ChallengeCard;

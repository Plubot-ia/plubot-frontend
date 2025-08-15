import { motion } from 'framer-motion';
import { Clock, Users, Zap } from 'lucide-react';
import PropTypes from 'prop-types';

const RankingTable = ({ rankings }) => (
  <motion.div
    className='mt-6'
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {rankings.map((entry, index) => (
      <motion.div
        key={entry.rank}
        className={`ranking-row delay-${index + 1}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <div className={`position-${entry.rank}`}>{entry.rank}</div>
        <img src={entry.avatar} alt={entry.user} className='battle-card-avatar' />
        <div className='flex-1'>
          <div className='flex justify-between items-center'>
            <span className='font-bold text-white text-lg'>{entry.user}</span>
            <span className='score-value'>{entry.score} puntos</span>
          </div>
          <div className='grid grid-cols-3 gap-2 mt-2'>
            <div className='flex items-center gap-1 text-xs text-gray-300'>
              <Zap size={14} className='text-yellow-400' />
              Eficiencia: {entry.efficiency}%
            </div>
            <div className='flex items-center gap-1 text-xs text-gray-300'>
              <Clock size={14} className='text-green-400' />
              Horas ahorradas: {entry.timesSaved}
            </div>
            <div className='flex items-center gap-1 text-xs text-gray-300'>
              <Users size={14} className='text-purple-400' />
              Interacciones: {entry.interactions}
            </div>
          </div>
        </div>
      </motion.div>
    ))}
  </motion.div>
);

RankingTable.propTypes = {
  rankings: PropTypes.arrayOf(
    PropTypes.shape({
      rank: PropTypes.number.isRequired,
      user: PropTypes.string.isRequired,
      score: PropTypes.number.isRequired,
      avatar: PropTypes.string.isRequired,
      efficiency: PropTypes.number.isRequired,
      timesSaved: PropTypes.number.isRequired,
      interactions: PropTypes.number.isRequired,
    }),
  ).isRequired,
};

export default RankingTable;

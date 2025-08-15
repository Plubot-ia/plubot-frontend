import { motion } from 'framer-motion';
import { Star, ShoppingCart, Download } from 'lucide-react';
import PropTypes from 'prop-types';

const BattleCard = ({ plubot }) => (
  <motion.div
    className='battle-card'
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className='battle-card-header'>
      <img src={plubot.avatar} alt={plubot.name} className='battle-card-avatar' />
      <div className='flex-1'>
        <h3 className='battle-card-title'>{plubot.name}</h3>
        <p className='battle-card-creator'>{plubot.creator}</p>
      </div>
      <div className='battle-card-level'>Nivel {plubot.level}</div>
    </div>
    <div className='battle-card-body'>
      <p className='battle-card-style'>{plubot.style}</p>
      <div className='battle-card-stats'>
        <div>
          <p className='stat-value'>{plubot.sales}</p>
          <p className='stat-label'>Ventas</p>
        </div>
        <div>
          <p className='stat-value'>{plubot.reviews}</p>
          <p className='stat-label'>Reseñas</p>
        </div>
        <div>
          <p className='stat-value'>{plubot.votes}</p>
          <p className='stat-label'>Votos</p>
        </div>
      </div>
      <div className='battle-card-badges'>
        {plubot.badges.map((badge) => (
          <span key={badge} className='badge'>
            {badge}
          </span>
        ))}
      </div>
    </div>
    <div className='battle-card-footer'>
      <span className='battle-card-price'>${plubot.price}</span>
      <div className='flex items-center gap-2'>
        <button className='action-button' type='button'>
          <Star size={16} />
        </button>
        <button className='action-button' type='button'>
          <ShoppingCart size={16} />
        </button>
        <button className='action-button primary' type='button'>
          <Download size={16} />
          <span>Probar</span>
        </button>
      </div>
    </div>
  </motion.div>
);

BattleCard.propTypes = {
  plubot: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    creator: PropTypes.string.isRequired,
    style: PropTypes.string.isRequired,
    sales: PropTypes.number.isRequired,
    reviews: PropTypes.number.isRequired,
    votes: PropTypes.number.isRequired,
    price: PropTypes.number.isRequired,
    avatar: PropTypes.string.isRequired,
    badges: PropTypes.arrayOf(PropTypes.string).isRequired,
    level: PropTypes.number.isRequired,
  }).isRequired,
};

export default BattleCard;

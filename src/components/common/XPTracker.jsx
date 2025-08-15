import PropTypes from 'prop-types';
import './XPTracker.css';

const XPTracker = ({ xpGained, level }) => {
  const totalXP = Number.parseInt(localStorage.getItem('plubot_xp_total') || '0', 10);

  return (
    <div className='xp-tracker'>
      <p>Nivel: {level}</p>
      <p>XP Total: {totalXP}</p>
      <p>XP en este artículo: {xpGained}</p>
    </div>
  );
};

XPTracker.propTypes = {
  xpGained: PropTypes.number.isRequired,
  level: PropTypes.number.isRequired,
};

export default XPTracker;

import PropTypes from 'prop-types';
import React from 'react';

const GameUI = ({ userLevel, pluCoins, showBadgeNotification }) => (
  <div className='game-ui'>
    <div className='player-stats'>
      <div className='level-badge'>
        <span className='level-number'>{userLevel}</span>
        <span className='level-text'>NIVEL</span>
      </div>
      <div className='coin-counter'>
        <div className='coin-icon' />
        <span>{pluCoins}</span>
      </div>
    </div>

    {showBadgeNotification && <div className='badge-notification'>¡Nuevo logro desbloqueado!</div>}
  </div>
);

GameUI.propTypes = {
  userLevel: PropTypes.number.isRequired,
  pluCoins: PropTypes.number.isRequired,
  showBadgeNotification: PropTypes.bool.isRequired,
};

export default GameUI;

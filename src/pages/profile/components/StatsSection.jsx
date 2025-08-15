import PropTypes from 'prop-types';
import React from 'react';

const StatsSection = ({
  userStats,
  pluCoins,
  dailyRewardAvailable,
  pulsatingElements,
  collectDailyReward,
  powerPercentage,
  handleViewPlubots,
  handleViewPowers,
}) => (
  <div className='profile-stats'>
    <div className='stat-card'>
      <div className='stat-value'>{userStats.totalPlubots}</div>
      <div className='stat-label'>Plubots</div>
      <button className='stat-action-button' onClick={handleViewPlubots}>
        Gestionar
      </button>
    </div>
    <div className='stat-card'>
      <div className='stat-value'>{userStats.activePowers}</div>
      <div className='stat-label'>Poderes</div>
      <div className='power-bar'>
        <div className='power-bar-fill' style={{ width: `${powerPercentage}%` }} />
      </div>
      <div className='power-text'>{powerPercentage}%</div>
      <button className='stat-action-button' onClick={handleViewPowers}>
        Gestionar
      </button>
    </div>
    <div className='stat-card'>
      <div className='stat-value'>{pluCoins ?? 0}</div>
      <div className='stat-label'>PluCoins</div>
      <div className='daily-reward'>
        <button
          className={`cyber-button small ${
            pulsatingElements.includes('dailyReward') ? 'pulsating' : ''
          }`}
          onClick={collectDailyReward}
          disabled={!dailyRewardAvailable}
        >
          {dailyRewardAvailable ? '🎁 Recompensa diaria' : '⏱️ Mañana'}
        </button>
      </div>
    </div>
  </div>
);

StatsSection.propTypes = {
  userStats: PropTypes.object.isRequired,
  pluCoins: PropTypes.number.isRequired,
  dailyRewardAvailable: PropTypes.bool.isRequired,
  pulsatingElements: PropTypes.array.isRequired,
  collectDailyReward: PropTypes.func.isRequired,
  powerPercentage: PropTypes.number.isRequired,
  handleViewPlubots: PropTypes.func.isRequired,
  handleViewPowers: PropTypes.func.isRequired,
};

export default StatsSection;

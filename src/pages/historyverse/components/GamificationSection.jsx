import PropTypes from 'prop-types';
import React from 'react';

const GamificationSection = ({ userLevel, pluCoins, badges, onLevelUp }) => (
  <section className='historyverse-gamification'>
    <h2 className='section-title'>Subí de nivel. Desbloqueá poderes.</h2>
    <div className='progression-panel'>
      <div className='level-progress'>
        <div className='level-indicator'>
          <span className='level-number'>{userLevel}</span>
          <span className='level-text'>NIVEL</span>
        </div>
        <div className='progress-bar-container'>
          <div className='progress-bar'>
            <div
              className='progress-fill'
              style={{ width: `${(pluCoins / (userLevel * 100)) * 100}%` }}
            />
          </div>
          <span className='progress-label'>
            {`${pluCoins} / ${userLevel * 100} PluCoins para el próximo nivel`}
          </span>
        </div>
      </div>

      <button
        type='button'
        className='level-up-button'
        disabled={pluCoins < userLevel * 100}
        onClick={onLevelUp}
      >
        Subir de Nivel
      </button>
    </div>

    <div className='achievements-panel'>
      <h3>Logros</h3>
      <div className='badge-grid'>
        {badges.map((badge) => (
          <div key={badge.id} className={`badge ${badge.unlocked ? 'unlocked' : ''}`}>
            <div className='badge-icon' />
            <div className='badge-info'>
              <h4>{badge.name}</h4>
              <p>{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

GamificationSection.propTypes = {
  userLevel: PropTypes.number.isRequired,
  pluCoins: PropTypes.number.isRequired,
  badges: PropTypes.array.isRequired,
  onLevelUp: PropTypes.func.isRequired,
};

export default GamificationSection;

import PropTypes from 'prop-types';
import React from 'react';

const AchievementsSection = ({
  expandedSection,
  toggleSectionExpansion,
  user,
  animateBadges,
  handleKeyDown,
}) => (
  <div className={`collapsible-section ${expandedSection === 'achievements' ? 'expanded' : ''}`}>
    <div
      className='section-header'
      role='button'
      tabIndex={0}
      onClick={(_event) => toggleSectionExpansion('achievements')}
      onKeyDown={(event) => handleKeyDown(event, 'achievements')}
    >
      <h3>Logros Desbloqueados</h3>
      <span className='material-icons expand-icon'>expand_more</span>
    </div>
    {expandedSection === 'achievements' && (
      <div className='section-content achievements-grid'>
        {user &&
          user.achievements &&
          user.achievements.map((achievement, index) => (
            <div
              key={achievement.title}
              className={`achievement-badge ${animateBadges ? 'animate-in' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
              title={`${achievement.title}: ${achievement.description}`}
            >
              <div className='achievement-icon'>{achievement.icon}</div>
            </div>
          ))}
        {(!user || !user.achievements || user.achievements.length === 0) && (
          <div className='empty-state'>
            <p>Aún no has desbloqueado logros</p>
          </div>
        )}
      </div>
    )}
  </div>
);

AchievementsSection.propTypes = {
  expandedSection: PropTypes.string,
  toggleSectionExpansion: PropTypes.func.isRequired,
  user: PropTypes.object,
  animateBadges: PropTypes.bool.isRequired,
  handleKeyDown: PropTypes.func.isRequired,
};

export default AchievementsSection;

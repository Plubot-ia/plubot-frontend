import PropTypes from 'prop-types';
import React from 'react';

const ActivitiesSection = ({
  expandedSection,
  toggleSectionExpansion,
  recentActivities,
  animateBadges,
  handleKeyDown,
}) => (
  <div className={`collapsible-section ${expandedSection === 'activities' ? 'expanded' : ''}`}>
    <div
      className='section-header'
      role='button'
      tabIndex={0}
      onClick={() => toggleSectionExpansion('activities')}
      onKeyDown={(event) => handleKeyDown(event, 'activities')}
    >
      <h3>Actividad Reciente</h3>
      <span className='material-icons expand-icon'>expand_more</span>
    </div>
    {expandedSection === 'activities' && (
      <div className='section-content activity-list'>
        {recentActivities.map((activity, index) => (
          <div
            key={activity.id}
            className={`activity-item ${animateBadges ? 'animate-in' : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className='activity-icon'>{activity.icon}</div>
            <div className='activity-details'>
              <div className='activity-text'>{activity.text}</div>
              <div className='activity-time'>{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

ActivitiesSection.propTypes = {
  expandedSection: PropTypes.string,
  toggleSectionExpansion: PropTypes.func.isRequired,
  recentActivities: PropTypes.array.isRequired,
  animateBadges: PropTypes.bool.isRequired,
  handleKeyDown: PropTypes.func.isRequired,
};

export default ActivitiesSection;

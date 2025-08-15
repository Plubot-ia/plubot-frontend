import PropTypes from 'prop-types';
import React from 'react';

const PowersSection = ({
  expandedSection,
  toggleSectionExpansion,
  user,
  animateBadges,
  getPowerDetails,
  handleViewPowers,
  handleKeyDown,
}) => (
  <div className={`collapsible-section ${expandedSection === 'powers' ? 'expanded' : ''}`}>
    <div
      className='section-header'
      role='button'
      tabIndex={0}
      onClick={() => toggleSectionExpansion('powers')}
      onKeyDown={(event) => handleKeyDown(event, 'powers')}
    >
      <h3>Poderes Activos</h3>
      <span className='material-icons expand-icon'>expand_more</span>
    </div>
    {expandedSection === 'powers' && (
      <div className='section-content powers-section'>
        {user &&
          user.powers &&
          user.powers.map((powerId, index) => {
            const power = getPowerDetails(powerId);
            return (
              <div
                key={powerId}
                className={`power-item ${animateBadges ? 'animate-in' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className='power-icon'>{power.icon}</div>
                <div className='power-details'>
                  <div className='power-title'>{power.title}</div>
                  <div className='power-description'>{power.description}</div>
                </div>
              </div>
            );
          })}

        {(!user || !user.powers || user.powers.length === 0) && (
          <div className='empty-state'>
            <p>Aún no has desbloqueado poderes</p>
            <button className='cyber-button small' onClick={handleViewPowers}>
              Explorar Poderes
            </button>
          </div>
        )}
      </div>
    )}
  </div>
);

PowersSection.propTypes = {
  expandedSection: PropTypes.string,
  toggleSectionExpansion: PropTypes.func.isRequired,
  user: PropTypes.object,
  animateBadges: PropTypes.bool.isRequired,
  getPowerDetails: PropTypes.func.isRequired,
  handleViewPowers: PropTypes.func.isRequired,
  handleKeyDown: PropTypes.func.isRequired,
};

export default PowersSection;

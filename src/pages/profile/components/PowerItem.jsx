import PropTypes from 'prop-types';
import React, { useState } from 'react';

const PowerItem = ({ power, powerDetails, animation, onRemove }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = () => setShowTooltip(true);
  const handleMouseLeave = () => setShowTooltip(false);

  const { title, icon, description } = powerDetails;
  const isActive = animation?.active;
  const isRemoving = animation?.removing;

  return (
    <div
      className={`power-item large ${isActive ? 'active' : ''} ${
        isRemoving ? 'removing' : ''
      } power-item-large-styles`}
      style={{
        animationDelay: `${animation?.delay ?? 0}ms`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className='power-icon large'>{icon}</div>
      <div className='power-name'>{title}</div>
      {showTooltip && (
        <div className='power-tooltip large'>
          <div className='tooltip-title'>{title}</div>
          <div className='tooltip-description'>{description}</div>
          <button
            className='cyber-button small'
            onClick={(event) => {
              event.stopPropagation();
              onRemove(power);
            }}
          >
            Desactivar
          </button>
        </div>
      )}
    </div>
  );
};

PowerItem.propTypes = {
  power: PropTypes.string.isRequired,
  powerDetails: PropTypes.shape({
    title: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  animation: PropTypes.shape({
    delay: PropTypes.number,
    active: PropTypes.bool,
    removing: PropTypes.bool,
  }),
  onRemove: PropTypes.func.isRequired,
};

PowerItem.defaultProps = {
  animation: {
    delay: 0,
    active: false,
    removing: false,
  },
};

export default PowerItem;

import PropTypes from 'prop-types';
import React from 'react';

const PlubotCardHeader = ({ plubot, plubotIcon, isUnremovable }) => (
  <>
    <div className='plubot-icon-container'>
      <div className='plubot-icon'>{plubotIcon}</div>
    </div>
    <h4 className='plubot-name'>
      {plubot.name || 'Plubot'}
      {isUnremovable && (
        <span
          title='Este Plubot no existe en el servidor pero aparece en la interfaz'
          style={{ color: '#ff9800' }}
        >
          {' '}
          (Fantasma)
        </span>
      )}
    </h4>
  </>
);

PlubotCardHeader.propTypes = {
  plubot: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
  plubotIcon: PropTypes.node.isRequired,
  isUnremovable: PropTypes.bool.isRequired,
};

export default PlubotCardHeader;

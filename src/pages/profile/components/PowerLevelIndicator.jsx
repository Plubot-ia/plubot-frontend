import PropTypes from 'prop-types';
import React from 'react';

const PowerLevelIndicator = ({ level }) => (
  <div className='modal-power-level'>
    <div className='power-bar'>
      <div
        className='power-fill'
        style={{
          width: `${Math.min(100, level * 20)}%`,
        }}
      />
    </div>
    <span className='power-text'>Nivel de Poder</span>
  </div>
);

PowerLevelIndicator.propTypes = {
  level: PropTypes.number.isRequired,
};

export default PowerLevelIndicator;

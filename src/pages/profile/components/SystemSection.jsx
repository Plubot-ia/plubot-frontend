import PropTypes from 'prop-types';
import React from 'react';

const SystemSection = ({ profileId, energyLevel }) => (
  <div className='system-status'>
    <div className='system-id'>ID: {profileId.current}</div>
    <div className='energy-container'>
      <div className='energy-label'>Energía del Sistema</div>
      <div className='energy-bar'>
        <div className='energy-bar-fill' style={{ width: `${energyLevel}%` }} />
      </div>
      <div className='energy-percentage'>{energyLevel}%</div>
    </div>
  </div>
);

SystemSection.propTypes = {
  profileId: PropTypes.shape({ current: PropTypes.any }).isRequired,
  energyLevel: PropTypes.number.isRequired,
};

export default SystemSection;

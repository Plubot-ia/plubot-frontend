import PropTypes from 'prop-types';
import React from 'react';

const CosmicLights = ({ isVisible }) => {
  if (!isVisible) {
    return;
  }

  return (
    <>
      <div className='light-beam light-beam-1' />
      <div className='light-beam light-beam-2' />
      <div className='light-beam light-beam-3' />
    </>
  );
};

CosmicLights.propTypes = {
  isVisible: PropTypes.bool.isRequired,
};

export default CosmicLights;

import PropTypes from 'prop-types';
import React from 'react';

const ParticleEffect = ({ show, particles }) => {
  if (!show) {
    return;
  }

  return (
    <div className='edit-modal-particles'>
      {particles.map((particle) => (
        <div key={particle.key} className='particle' style={particle.style} />
      ))}
    </div>
  );
};

ParticleEffect.propTypes = {
  show: PropTypes.bool.isRequired,
  particles: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      style: PropTypes.object.isRequired,
    }),
  ).isRequired,
};

export default ParticleEffect;

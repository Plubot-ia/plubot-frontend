import PropTypes from 'prop-types';
import React from 'react';

const Particles = ({ isVisible, count }) => {
  if (!isVisible) {
    return;
  }

  return (
    <>
      {/* eslint-disable react/no-array-index-key */}
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`particle-${index}`}
          className={`particle particle-${index + 1}`}
          style={{
            top: `${(index * 7) % 100}%`,
            left: `${(index * 13) % 100}%`,
            animationDuration: `${3 + (index % 3)}s`,
          }}
        />
      ))}
      {/* eslint-enable react/no-array-index-key */}
    </>
  );
};

Particles.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  count: PropTypes.number.isRequired,
};

export default Particles;

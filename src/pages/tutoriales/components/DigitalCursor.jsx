import PropTypes from 'prop-types';
import React from 'react';

const DigitalCursor = ({ position, isHovering }) => (
  <div
    className='digital-cursor'
    style={{
      left: `${position.x}px`,
      top: `${position.y}px`,
      opacity: isHovering ? 1 : 0,
    }}
  />
);

DigitalCursor.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  isHovering: PropTypes.bool.isRequired,
};

export default DigitalCursor;

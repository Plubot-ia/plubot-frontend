import PropTypes from 'prop-types';
import React from 'react';

const GridLines = ({ isVisible }) => {
  if (!isVisible) {
    return;
  }

  const horizontalLines = 5;
  const verticalLines = 5;

  return (
    <>
      {/* eslint-disable react/no-array-index-key */}
      {Array.from({ length: horizontalLines }).map((_, index) => (
        <div
          key={`h-line-${index}`}
          className='horizontal-line'
          style={{
            top: `${(index + 1) * (100 / (horizontalLines + 1))}%`,
            animationDelay: `${index * 0.2}s`,
          }}
        />
      ))}
      {/* eslint-enable react/no-array-index-key */}
      {/* eslint-disable react/no-array-index-key */}
      {Array.from({ length: verticalLines }).map((_, index) => (
        <div
          key={`line-${index}-v`}
          className='vertical-line'
          style={{
            left: `${(index + 1) * (100 / (verticalLines + 1))}%`,
            animationDelay: `${index * 0.2 + 0.1}s`,
          }}
        />
      ))}
      {/* eslint-enable react/no-array-index-key */}
    </>
  );
};

GridLines.propTypes = {
  isVisible: PropTypes.bool.isRequired,
};

export default GridLines;

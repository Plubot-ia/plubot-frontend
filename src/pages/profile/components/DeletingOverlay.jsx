import PropTypes from 'prop-types';
import React from 'react';

const DeletingOverlay = ({ isDeleting }) => {
  if (!isDeleting) {
    return;
  }

  return (
    <div
      className='deleting-overlay'
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 10,
        borderRadius: 'inherit',
      }}
    >
      <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>Eliminando...</span>
    </div>
  );
};

DeletingOverlay.propTypes = {
  isDeleting: PropTypes.bool.isRequired,
};

export default DeletingOverlay;

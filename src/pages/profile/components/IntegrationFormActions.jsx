import PropTypes from 'prop-types';
import React from 'react';

const IntegrationFormActions = ({ isLoading, getButtonText, handleClose }) => (
  <div className='modal-actions'>
    <button type='submit' className='cyber-button save-button' disabled={isLoading}>
      {getButtonText()}
    </button>
    <button
      type='button'
      className='cyber-button cancel-button'
      onClick={handleClose}
      disabled={isLoading}
    >
      Cancelar
    </button>
  </div>
);

IntegrationFormActions.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  getButtonText: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default IntegrationFormActions;

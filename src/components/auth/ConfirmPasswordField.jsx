import PropTypes from 'prop-types';
import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ConfirmPasswordField = ({
  confirmPassword,
  showConfirmPassword,
  setConfirmPassword,
  setShowConfirmPassword,
}) => (
  <div className='reset-password-form-group'>
    <label className='reset-password-form-label' htmlFor='confirm_password'>
      Confirmar Contraseña
    </label>
    <div className='reset-password-input-wrapper'>
      <input
        type={showConfirmPassword ? 'text' : 'password'}
        id='confirm_password'
        name='confirm_password'
        className='reset-password-form-input'
        placeholder='Confirma tu nueva contraseña'
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />
      <button
        type='button'
        className='reset-password-toggle-password'
        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        aria-label='Mostrar/Ocultar confirmación de contraseña'
      >
        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  </div>
);

ConfirmPasswordField.propTypes = {
  confirmPassword: PropTypes.string.isRequired,
  showConfirmPassword: PropTypes.bool.isRequired,
  setConfirmPassword: PropTypes.func.isRequired,
  setShowConfirmPassword: PropTypes.func.isRequired,
};

export default ConfirmPasswordField;

import PropTypes from 'prop-types';
import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ConfirmPasswordInput = ({
  confirmPassword,
  setConfirmPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordMatch,
}) => (
  <div className='register-form-group'>
    <label htmlFor='confirm-password' className='register-form-label'>
      Confirmar contraseña
    </label>
    <div className='register-input-wrapper'>
      <input
        type={showConfirmPassword ? 'text' : 'password'}
        id='confirm-password'
        name='confirm-password'
        className='register-form-input'
        placeholder='Confirma tu contraseña'
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />
      <button
        type='button'
        className='register-toggle-password'
        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        aria-label='Mostrar/Ocultar confirmar contraseña'
      >
        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
    {passwordMatch.text && (
      <div
        className={`register-password-match-message register-password-match-message-${passwordMatch.type}`}
      >
        {passwordMatch.text}
      </div>
    )}
  </div>
);

ConfirmPasswordInput.propTypes = {
  confirmPassword: PropTypes.string.isRequired,
  setConfirmPassword: PropTypes.func.isRequired,
  showConfirmPassword: PropTypes.bool.isRequired,
  setShowConfirmPassword: PropTypes.func.isRequired,
  passwordMatch: PropTypes.shape({
    text: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
};

export default ConfirmPasswordInput;

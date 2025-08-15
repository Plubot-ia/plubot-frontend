import PropTypes from 'prop-types';
import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const NewPasswordField = ({ newPassword, showNewPassword, setNewPassword, setShowNewPassword }) => (
  <div className='reset-password-form-group'>
    <label className='reset-password-form-label' htmlFor='new_password'>
      Nueva Contraseña
    </label>
    <div className='reset-password-input-wrapper'>
      <input
        type={showNewPassword ? 'text' : 'password'}
        id='new_password'
        name='new_password'
        className='reset-password-form-input'
        placeholder='Ingresa tu nueva contraseña'
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        required
      />
      <button
        type='button'
        className='reset-password-toggle-password'
        onClick={() => setShowNewPassword(!showNewPassword)}
        aria-label='Mostrar/Ocultar nueva contraseña'
      >
        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  </div>
);

NewPasswordField.propTypes = {
  newPassword: PropTypes.string.isRequired,
  showNewPassword: PropTypes.bool.isRequired,
  setNewPassword: PropTypes.func.isRequired,
  setShowNewPassword: PropTypes.func.isRequired,
};

export default NewPasswordField;

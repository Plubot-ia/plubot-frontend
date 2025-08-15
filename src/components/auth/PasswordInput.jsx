import PropTypes from 'prop-types';
import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const PasswordInput = ({
  showPassword,
  setShowPassword,
  password,
  handlePasswordChange,
  strength,
}) => (
  <div className='register-form-group'>
    <label htmlFor='password' className='register-form-label'>
      Contraseña
    </label>
    <div className='register-input-wrapper'>
      <input
        type={showPassword ? 'text' : 'password'}
        id='password'
        name='password'
        className='register-form-input'
        placeholder='Crea una contraseña segura'
        value={password}
        onChange={handlePasswordChange}
        required
      />
      <button
        type='button'
        className='register-toggle-password'
        onClick={() => setShowPassword(!showPassword)}
        aria-label='Mostrar/Ocultar contraseña'
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
    <div className='register-password-strength'>
      <div
        id='strength-meter'
        className='register-strength-meter'
        style={{
          width: `${Math.min(strength.width, 100)}%`,
          backgroundColor: strength.color,
        }}
      />
    </div>
    <div id='strength-text' className='register-strength-text'>
      Seguridad: {strength.text}
    </div>
  </div>
);

PasswordInput.propTypes = {
  showPassword: PropTypes.bool.isRequired,
  setShowPassword: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  handlePasswordChange: PropTypes.func.isRequired,
  strength: PropTypes.shape({
    width: PropTypes.number,
    color: PropTypes.string,
    text: PropTypes.string,
  }).isRequired,
};

export default PasswordInput;

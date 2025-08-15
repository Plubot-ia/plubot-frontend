import PropTypes from 'prop-types';
import React from 'react';

import ConfirmPasswordInput from './ConfirmPasswordInput';
import GoogleAuthButton from './GoogleAuthButton';
import PasswordInput from './PasswordInput';

const RegisterForm = ({
  name,
  setName,
  email,
  password,
  confirmPassword,
  setConfirmPassword,
  strength,
  isSubmitting,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordMatch,
  handleEmailChange,
  handlePasswordChange,
  handleSubmit,
}) => (
  <form id='register-form' action='' onSubmit={handleSubmit}>
    <div className='register-form-group'>
      <label htmlFor='name' className='register-form-label'>
        Nombre completo
      </label>
      <input
        type='text'
        id='name'
        name='name'
        className='register-form-input'
        placeholder='Tu nombre completo'
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
    </div>
    <div className='register-form-group'>
      <label htmlFor='email' className='register-form-label'>
        Correo electrónico
      </label>
      <input
        type='email'
        id='email'
        name='email'
        className='register-form-input'
        placeholder='correo@ejemplo.com'
        value={email}
        onChange={handleEmailChange}
        required
      />
    </div>
    <PasswordInput
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      password={password}
      handlePasswordChange={handlePasswordChange}
      strength={strength}
    />
    <ConfirmPasswordInput
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
      passwordMatch={passwordMatch}
    />
    <button type='submit' className='register-btn' disabled={isSubmitting}>
      {isSubmitting ? 'Procesando...' : 'REGISTRARSE'}
      <span className='register-btn-glow' />
    </button>

    <div className='register-separator'>
      <span>o</span>
    </div>

    <GoogleAuthButton text='Registrarse con Google' className='futuristic' isRegister />
  </form>
);

RegisterForm.propTypes = {
  name: PropTypes.string.isRequired,
  setName: PropTypes.func.isRequired,
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  confirmPassword: PropTypes.string.isRequired,
  setConfirmPassword: PropTypes.func.isRequired,
  strength: PropTypes.shape({
    width: PropTypes.number,
    color: PropTypes.string,
    text: PropTypes.string,
  }).isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  showPassword: PropTypes.bool.isRequired,
  setShowPassword: PropTypes.func.isRequired,
  showConfirmPassword: PropTypes.bool.isRequired,
  setShowConfirmPassword: PropTypes.func.isRequired,
  passwordMatch: PropTypes.shape({
    text: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  handleEmailChange: PropTypes.func.isRequired,
  handlePasswordChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
};

export default RegisterForm;

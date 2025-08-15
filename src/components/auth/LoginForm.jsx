import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginForm = ({
  formData,
  showPassword,
  isSubmitting,
  setShowPassword,
  handleChange,
  handleLogin,
}) => (
  <form onSubmit={handleLogin}>
    <div className='login-form-group'>
      <label htmlFor='email' className='login-form-label'>
        Email
      </label>
      <input
        type='email'
        id='email'
        name='email'
        className='login-form-input'
        placeholder='correo@ejemplo.com'
        value={formData.email}
        onChange={handleChange}
        required
        aria-required='true'
      />
    </div>
    <div className='login-form-group'>
      <label htmlFor='password' className='login-form-label'>
        Contraseña
      </label>
      <div className='login-input-wrapper'>
        <input
          type={showPassword ? 'text' : 'password'}
          id='password'
          name='password'
          className='login-form-input'
          placeholder='Ingresa tu contraseña'
          value={formData.password}
          onChange={handleChange}
          required
          aria-required='true'
        />
        <button
          type='button'
          className='login-toggle-password'
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
    <motion.button
      type='submit'
      className='login-btn'
      disabled={isSubmitting}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Entrar
    </motion.button>
  </form>
);

LoginForm.propTypes = {
  formData: PropTypes.shape({
    email: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired,
  }).isRequired,
  showPassword: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  setShowPassword: PropTypes.func.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleLogin: PropTypes.func.isRequired,
};

export default LoginForm;

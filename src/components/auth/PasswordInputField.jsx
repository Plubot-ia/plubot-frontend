import PropTypes from 'prop-types';
import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './PasswordInputField.css';

/**
 * Componente reutilizable para un campo de entrada de contraseña con
 * la funcionalidad de mostrar/ocultar contraseña.
 */
const PasswordInputField = ({ id, label, value, onChange, placeholder = '••••••••' }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((previous) => !previous);
  };

  return (
    <div className='password-input-field-group'>
      <label htmlFor={id} className='password-input-field-label'>
        {label}
      </label>
      <div className='password-input-field-wrapper'>
        <input
          id={id}
          type={isPasswordVisible ? 'text' : 'password'}
          name={id}
          className='password-input-field-input'
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          autoComplete={id === 'currentPassword' ? 'current-password' : 'new-password'}
        />
        <span
          role='button'
          tabIndex={0}
          className='password-input-field-toggle'
          onClick={togglePasswordVisibility}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              togglePasswordVisibility();
            }
          }}
          aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {isPasswordVisible ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>
    </div>
  );
};

PasswordInputField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default PasswordInputField;

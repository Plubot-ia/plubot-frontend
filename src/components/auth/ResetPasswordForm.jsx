import PropTypes from 'prop-types';
import React from 'react';

import ConfirmPasswordField from './ConfirmPasswordField';
import NewPasswordField from './NewPasswordField';

const ResetPasswordForm = ({
  newPassword,
  confirmPassword,
  showNewPassword,
  showConfirmPassword,
  isSubmitting,
  setNewPassword,
  setConfirmPassword,
  setShowNewPassword,
  setShowConfirmPassword,
  handleSubmit,
  handleNavigateToLogin,
}) => (
  <>
    <form onSubmit={handleSubmit}>
      <NewPasswordField
        newPassword={newPassword}
        showNewPassword={showNewPassword}
        setNewPassword={setNewPassword}
        setShowNewPassword={setShowNewPassword}
      />
      <ConfirmPasswordField
        confirmPassword={confirmPassword}
        showConfirmPassword={showConfirmPassword}
        setConfirmPassword={setConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
      />
      <button type='submit' className='reset-password-btn' disabled={isSubmitting}>
        {isSubmitting ? 'Restableciendo...' : 'Restablecer Contraseña'}
      </button>
    </form>
    <div className='reset-password-form-footer'>
      <p>
        ¿Recordaste tu contraseña?{' '}
        <button
          type='button'
          onClick={handleNavigateToLogin}
          style={{
            cursor: 'pointer',
            color: '#00e0ff',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
          }}
          className='reset-password-form-footer-link'
        >
          Iniciar sesión
        </button>
      </p>
    </div>
  </>
);

ResetPasswordForm.propTypes = {
  newPassword: PropTypes.string.isRequired,
  confirmPassword: PropTypes.string.isRequired,
  showNewPassword: PropTypes.bool.isRequired,
  showConfirmPassword: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  setNewPassword: PropTypes.func.isRequired,
  setConfirmPassword: PropTypes.func.isRequired,
  setShowNewPassword: PropTypes.func.isRequired,
  setShowConfirmPassword: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleNavigateToLogin: PropTypes.func.isRequired,
};

export default ResetPasswordForm;

import { useTranslation } from 'react-i18next';

import plubotLogo from '../../assets/img/logo.svg';
import useCardTiltEffect from '../../hooks/useCardTiltEffect';
import usePasswordForm from '../../hooks/usePasswordForm';

import PasswordInputField from './PasswordInputField';

import './ChangePassword.css';

/**
 * Componente para la página de cambio de contraseña.
 * Utiliza un efecto de inclinación en la tarjeta y gestiona el estado del formulario
 * a través de hooks personalizados.
 */
const ChangePassword = () => {
  const { t: translation } = useTranslation();
  const cardRef = useCardTiltEffect();
  const { passwords, error, successMessage, handlePasswordChange, handleSubmit } =
    usePasswordForm();

  return (
    <div className='change-password-container'>
      <div className='change-password-cosmic-lights'>
        <div className='change-password-light-beam change-password-light-beam-1' />
        <div className='change-password-light-beam change-password-light-beam-2' />
        <div className='change-password-light-beam change-password-light-beam-3' />
      </div>
      <div className='change-password-particles' />

      <div className='change-password-card' ref={cardRef}>
        <header className='change-password-card-header'>
          <div className='change-password-logo'>
            <img src={plubotLogo} alt='Logo de Plubot' />
          </div>
          <h1 className='change-password-card-title'>Actualización Cósmica</h1>
          <p className='change-password-card-subtitle'>Refuerza tu acceso al Pluniverso.</p>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <PasswordInputField
            id='currentPassword'
            label={translation('currentPassword')}
            value={passwords.currentPassword}
            onChange={handlePasswordChange}
            placeholder={translation('enterCurrentPassword')}
          />

          <PasswordInputField
            id='newPassword'
            label={translation('newPassword')}
            value={passwords.newPassword}
            onChange={handlePasswordChange}
            placeholder={translation('createNewPassword')}
          />

          <PasswordInputField
            id='confirmPassword'
            label={translation('confirmNewPassword')}
            value={passwords.confirmPassword}
            onChange={handlePasswordChange}
            placeholder={translation('confirmYourNewPassword')}
          />

          {error && <p className='change-password-error-message'>{error}</p>}
          {successMessage && <p className='change-password-success-message'>{successMessage}</p>}

          <button type='submit' className='change-password-btn'>
            {translation('updatePassword')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;

import React from 'react';

import { useResetPassword } from '../../hooks/useResetPassword';

import './ResetPassword.css';
import ResetPasswordEffects from './ResetPasswordEffects';
import ResetPasswordForm from './ResetPasswordForm';
import ResetPasswordHeader from './ResetPasswordHeader';

const ResetPassword = () => {
  const { message, cardRef, ...formProps } = useResetPassword();

  return (
    <div className='reset-password-container'>
      <ResetPasswordEffects cardRef={cardRef} />
      <div className='reset-password-card' ref={cardRef}>
        <ResetPasswordHeader />
        {message.text && (
          <div
            className={`reset-password-message reset-password-message-${message.type} reset-password-show`}
          >
            {message.text}
          </div>
        )}
        <ResetPasswordForm {...formProps} />
      </div>
    </div>
  );
};

export default ResetPassword;

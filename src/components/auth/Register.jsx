import useRegister from '../../hooks/useRegister';

import RegisterBackground from './RegisterBackground';
import RegisterFooter from './RegisterFooter';
import RegisterForm from './RegisterForm';
import './Register.css';

const Register = () => {
  const {
    name,
    setName,
    email,
    password,
    confirmPassword,
    setConfirmPassword,
    message,
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
  } = useRegister();

  return (
    <div className='register-register-container'>
      <RegisterBackground />
      <div className='register-register-card'>
        <div className='register-card-header'>
          <div className='register-logo'>
            <img src='/logo.svg' alt='PLUBOT' />
          </div>
          <h1 className='register-card-title'>CREAR CUENTA</h1>
          <p className='register-card-subtitle'>Comienza a crear tu compañero digital</p>
        </div>
        {message.text && (
          <div className={`register-message register-message-${message.type} register-show`}>
            {message.text}
          </div>
        )}
        <RegisterForm
          name={name}
          setName={setName}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          strength={strength}
          isSubmitting={isSubmitting}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          passwordMatch={passwordMatch}
          handleEmailChange={handleEmailChange}
          handlePasswordChange={handlePasswordChange}
          handleSubmit={handleSubmit}
        />
        <RegisterFooter />
      </div>
    </div>
  );
};

export default Register;

import { motion } from 'framer-motion';

import { useLogin } from '../../hooks/useLogin';

import GoogleAuthButton from './GoogleAuthButton';
import LoginBackground from './LoginBackground';
import LoginFooter from './LoginFooter';
import LoginForm from './LoginForm';
import './Login.css';

const Login = () => {
  const {
    formData,
    showPassword,
    message,
    isSubmitting,
    setShowPassword,
    getContextualMessage,
    handleChange,
    handleLogin,
  } = useLogin();

  return (
    <motion.div
      className='login-login-container'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <LoginBackground />
      <motion.div
        className='login-login-card'
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
      >
        <div className='login-card-header'>
          <div className='login-logo'>
            <img src='/logo.svg' alt='PLUBOT' />
          </div>
          <h2 className='login-card-title'>Iniciar Sesión</h2>
          <p className='login-card-subtitle'>{getContextualMessage()}</p>
        </div>
        {message.text?.length > 0 && (
          <div
            key={message.text}
            className={`login-message login-message-${message.type} login-show`}
            aria-live='polite'
          >
            {message.text}
          </div>
        )}
        <LoginForm
          formData={formData}
          showPassword={showPassword}
          isSubmitting={isSubmitting}
          setShowPassword={setShowPassword}
          handleChange={handleChange}
          handleLogin={handleLogin}
        />

        <div className='login-separator'>
          <span className='login-separator-text'>o</span>
        </div>

        <GoogleAuthButton text='Iniciar sesión con Google' className='futuristic' />

        <LoginFooter />
      </motion.div>
    </motion.div>
  );
};

export default Login;

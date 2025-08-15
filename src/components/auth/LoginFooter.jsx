import React from 'react';
import { Link } from 'react-router-dom';

const LoginFooter = () => (
  <div className='login-form-footer'>
    <p className='mt-4 text-center'>
      ¿No tienes una cuenta?{' '}
      <Link to='/register' className='text-plubot-accent hover:underline'>
        Regístrate acá
      </Link>
    </p>
    <p className='mt-2 text-center'>
      <Link to='/forgot-password' className='text-plubot-accent hover:underline text-sm'>
        ¿Olvidaste tu contraseña?
      </Link>
    </p>
    <p className='mt-2 text-center'>
      <Link to='/resend-verification' className='login-resend-link'>
        ¿No recibiste la verificación? Reenviar correo
      </Link>
    </p>
  </div>
);

export default LoginFooter;

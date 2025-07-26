import React from 'react';
import { Link } from 'react-router-dom';

const RegisterFooter = () => (
  <div className='register-form-footer'>
    <p className='mt-4 text-center'>
      ¿Ya tienes una cuenta?{' '}
      <Link to='/login' className='text-plubot-accent hover:underline'>
        Iniciar sesión
      </Link>
    </p>
  </div>
);

export default RegisterFooter;

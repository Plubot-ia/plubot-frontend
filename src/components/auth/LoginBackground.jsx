import React from 'react';

const LoginBackground = () => (
  <>
    <div className='login-cosmic-lights'>
      <div className='login-light-beam login-light-beam-1' />
      <div className='login-light-beam login-light-beam-2' />
      <div className='login-light-beam login-light-beam-3' />
    </div>
    <div className='login-particles'>
      {['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((key, index) => (
        <div key={key} className={`login-particle login-particle-${index + 1}`} />
      ))}
    </div>
  </>
);

export default LoginBackground;

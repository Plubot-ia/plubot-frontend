import React from 'react';

const ResendBackground = () => (
  <>
    <div className='resend-cosmic-lights'>
      <div className='resend-light-beam resend-light-beam-1' />
      <div className='resend-light-beam resend-light-beam-2' />
      <div className='resend-light-beam resend-light-beam-3' />
    </div>
    <div className='resend-particles'>
      {['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((key, index) => (
        <div key={key} className={`resend-particle resend-particle-${index + 1}`} />
      ))}
    </div>
  </>
);

export default ResendBackground;

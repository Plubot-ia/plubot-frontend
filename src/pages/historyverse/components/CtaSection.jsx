import React from 'react';
import { Link } from 'react-router-dom';

const CtaSection = () => (
  <section className='historyverse-cta'>
    <Link to='/welcome' className='hero-button'>
      <span className='button-text'>Crear mi Plubot</span>
      <div className='button-particles' />
    </Link>
  </section>
);

export default CtaSection;

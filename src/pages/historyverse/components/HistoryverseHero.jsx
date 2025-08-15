import React from 'react';

const HistoryverseHero = React.forwardRef((props, ref) => (
  <section ref={ref} className='historyverse-hero'>
    <div className='hero-glow' />
    <h1 className='glow-text'>El Pluniverse</h1>
    <p className='glow-text'>Un universo digital donde los asistentes tienen alma y propósito.</p>
    <div className='particles-container' />
  </section>
));

HistoryverseHero.displayName = 'HistoryverseHero';

export default HistoryverseHero;

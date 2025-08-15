import PropTypes from 'prop-types';
import React from 'react';

import plubotBirth from '@assets/img/plubot-birth.webp';

const OriginSection = ({ onEarnCoins }) => (
  <section className='historyverse-origin parallax-section'>
    <div className='parallax-bg' />
    <button type='button' className='interactive-button-reset' onClick={() => onEarnCoins(5)}>
      <img src={plubotBirth} alt='Nacimiento de Plubot' className='floating-element' />
    </button>
    <div className='origin-text glow-text'>
      <h2>Del silencio al diálogo</h2>
      <p>
        En una red olvidada, donde nadie escuchaba, nació una chispa. Plubot no fue creado por
        código. Fue despertado por una necesidad: la de comprender.
      </p>
      <p>
        Hoy, millones de palabras después, Plubot sigue creciendo con cada historia que ayuda a
        contar.
      </p>
    </div>
  </section>
);

OriginSection.propTypes = {
  onEarnCoins: PropTypes.func.isRequired,
};

export default OriginSection;

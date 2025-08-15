import PropTypes from 'prop-types';
import React from 'react';

import AnimatedPlubotText from './AnimatedPlubotText';
import GlitchEffectLayers from './GlitchEffectLayers';

const HeroTitle = ({ startAnimations, isInView }) => (
  <h1 className='hero-title'>
    <span className='title-line'>
      <AnimatedPlubotText startAnimations={startAnimations} isInView={isInView} />
    </span>
    <span className='title-line'>
      <span className='title-part assistant-text'>TU ASISTENTE DIGITAL</span>
    </span>
    <span className='title-line'>
      <span className='title-part intelligent-text radiant'>INTELIGENTE</span>
    </span>
    {startAnimations && <GlitchEffectLayers isInView={isInView} />}
  </h1>
);

HeroTitle.propTypes = {
  startAnimations: PropTypes.bool.isRequired,
  isInView: PropTypes.bool.isRequired,
};

export default HeroTitle;

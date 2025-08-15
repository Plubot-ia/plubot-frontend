import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';

import { glitchCyanPlubotVariants, glitchMagentaPlubotVariants } from './hero-title-animations';

const GlitchEffectLayers = ({ isInView }) => (
  <>
    <span className='glitch-layer glitch-layer-cyan' aria-hidden='true'>
      <span className='title-line glitch-plubot-line'>
        <motion.span
          className='title-part plubot-text'
          variants={glitchCyanPlubotVariants}
          animate={isInView ? 'animate' : 'initial'}
          style={{ opacity: 0.4 }}
        >
          PLUBOT
        </motion.span>
      </span>
      <span className='title-line'>
        <span className='title-part assistant-text'>TU ASISTENTE DIGITAL</span>
      </span>
      <span className='title-line'>
        <span className='title-part intelligent-text'>INTELIGENTE</span>
      </span>
    </span>
    <span className='glitch-layer glitch-layer-magenta' aria-hidden='true'>
      <span className='title-line glitch-plubot-line'>
        <motion.span
          className='title-part plubot-text'
          variants={glitchMagentaPlubotVariants}
          animate={isInView ? 'animate' : 'initial'}
          style={{ opacity: 0.3 }}
        >
          PLUBOT
        </motion.span>
      </span>
      <span className='title-line'>
        <span className='title-part assistant-text'>TU ASISTENTE DIGITAL</span>
      </span>
      <span className='title-line'>
        <span className='title-part intelligent-text'>INTELIGENTE</span>
      </span>
    </span>
  </>
);

GlitchEffectLayers.propTypes = {
  isInView: PropTypes.bool.isRequired,
};

export default GlitchEffectLayers;

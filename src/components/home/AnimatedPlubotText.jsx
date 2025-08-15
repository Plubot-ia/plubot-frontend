import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';

import {
  plubotVariants,
  glitchCyanPlubotVariants,
  glitchMagentaPlubotVariants,
} from './hero-title-animations';

const AnimatedPlubotText = ({ startAnimations, isInView }) => (
  <motion.span
    className='title-part plubot-text plubot-animated'
    initial={{ opacity: 1 }}
    variants={plubotVariants}
    animate={startAnimations && isInView ? 'animate' : 'initial'}
  >
    PLUBOT
    {startAnimations && (
      <>
        <motion.span
          className='glitch-layer glitch-layer-cyan plubot-glitch plubot-text'
          aria-hidden='true'
          variants={glitchCyanPlubotVariants}
          animate={isInView ? 'animate' : 'initial'}
          style={{ opacity: 0.5 }}
        >
          PLUBOT
        </motion.span>
        <motion.span
          className='glitch-layer glitch-layer-magenta plubot-glitch plubot-text'
          aria-hidden='true'
          variants={glitchMagentaPlubotVariants}
          animate={isInView ? 'animate' : 'initial'}
          style={{ opacity: 0.4 }}
        >
          PLUBOT
        </motion.span>
        <span className='glitch-layer plubot-glow plubot-text' aria-hidden='true'>
          PLUBOT
        </span>
      </>
    )}
  </motion.span>
);

AnimatedPlubotText.propTypes = {
  startAnimations: PropTypes.bool.isRequired,
  isInView: PropTypes.bool.isRequired,
};

export default AnimatedPlubotText;

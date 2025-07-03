import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';

// Animation variants can be defined outside the component
// as they don't depend on props or state.
const plubotVariants = {
  animate: {
    translateY: [0, -2, 0],
    scale: [1, 1.03, 1],
    transition: {
      translateY: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        delay: 0.5,
      },
      scale: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        delay: 0.5,
      },
    },
  },
  initial: { translateY: 0, scale: 1 },
};

const glitchCyanPlubotVariants = {
  animate: {
    translateY: [0, -2, 0],
    scale: [1, 1.02, 1],
    transition: {
      translateY: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        delay: 0.6,
      },
      scale: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        delay: 0.6,
      },
    },
  },
  initial: { translateY: 0, scale: 1 },
};

const glitchMagentaPlubotVariants = {
  animate: {
    translateY: [0, -2, 0],
    scale: [1, 1.01, 1],
    transition: {
      translateY: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        delay: 0.7,
      },
      scale: {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        delay: 0.7,
      },
    },
  },
  initial: { translateY: 0, scale: 1 },
};

const HeroTitle = ({ startAnimations, isInView }) => (
  <h1 className='hero-title'>
    <span className='title-line'>
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
            <span
              className='glitch-layer plubot-glow plubot-text'
              aria-hidden='true'
            >
              PLUBOT
            </span>
          </>
        )}
      </motion.span>
    </span>
    <span className='title-line'>
      <span className='title-part assistant-text'>TU ASISTENTE DIGITAL</span>
    </span>
    <span className='title-line'>
      <span className='title-part intelligent-text radiant'>INTELIGENTE</span>
    </span>
    {startAnimations && (
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
            <span className='title-part assistant-text'>
              TU ASISTENTE DIGITAL
            </span>
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
            <span className='title-part assistant-text'>
              TU ASISTENTE DIGITAL
            </span>
          </span>
          <span className='title-line'>
            <span className='title-part intelligent-text'>INTELIGENTE</span>
          </span>
        </span>
      </>
    )}
  </h1>
);

HeroTitle.propTypes = {
  startAnimations: PropTypes.bool.isRequired,
  isInView: PropTypes.bool.isRequired,
};

export default HeroTitle;

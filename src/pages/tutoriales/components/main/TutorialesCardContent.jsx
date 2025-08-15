import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';

const buttonVariants = {
  hover: {
    scale: 1.05,
    boxShadow: '0 0 15px rgba(0, 255, 255, 0.8)',
    textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
  },
  tap: { scale: 0.95 },
};

const TutorialesCardContent = ({ showMore, setShowMore }) => (
  <>
    <motion.h3
      className='about-subtitle'
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      Tu Guía en el Pluniverse
    </motion.h3>

    <motion.p
      className='about-text'
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      Byte está aquí para ayudarte a navegar, automatizar y dominar el Pluniverse. ¿Listo para
      empezar?
    </motion.p>

    <motion.button
      className='cyberpunk-button'
      variants={buttonVariants}
      whileHover='hover'
      whileTap='tap'
      onClick={() => {
        setShowMore((previous) => !previous);
      }}
    >
      <span className='button-glow' />
      <span className='button-text'>{showMore ? 'CERRAR INFO' : 'VER INFO'}</span>
      <div className='button-icon'>{showMore ? '×' : '▶'}</div>
    </motion.button>
  </>
);

TutorialesCardContent.propTypes = {
  showMore: PropTypes.bool.isRequired,
  setShowMore: PropTypes.func.isRequired,
};

export default TutorialesCardContent;

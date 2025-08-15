import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';

const ExpansionButtonContainer = ({ showMore, setShowMore, buttonVariants }) => (
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
    <span className='button-text'>{showMore ? 'CERRAR PROTOCOLO' : 'VER PROTOCOLO'}</span>
    <div className='button-icon'>{showMore ? '×' : '▶'}</div>
  </motion.button>
);

ExpansionButtonContainer.propTypes = {
  showMore: PropTypes.bool.isRequired,
  setShowMore: PropTypes.func.isRequired,
  buttonVariants: PropTypes.object.isRequired,
};

export default ExpansionButtonContainer;

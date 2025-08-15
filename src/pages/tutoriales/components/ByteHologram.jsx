import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';

import byteAvatar from '@assets/img/byte.png';

const ByteHologram = ({ currentPhrase }) => (
  <>
    <div className='avatar-container'>
      <img src={byteAvatar} alt='Byte Avatar' className='byte-avatar' />
      <div className='ring ring1' />
      <div className='ring ring2' />
      <div className='ring ring3' />
    </div>
    <AnimatePresence mode='wait'>
      <motion.div
        key={currentPhrase}
        className='byte-dialog'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
      >
        {currentPhrase}
      </motion.div>
    </AnimatePresence>
  </>
);

ByteHologram.propTypes = {
  currentPhrase: PropTypes.string.isRequired,
};

export default ByteHologram;

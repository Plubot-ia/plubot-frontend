import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import ByteHologram from './ByteHologram';
import FlujosExpansion from './FlujosExpansion';

const flujosCardProperties = {
  hookValues: PropTypes.shape({
    currentPhrase: PropTypes.string.isRequired,
    buttonVariants: PropTypes.object.isRequired,
  }).isRequired,
};

const FlujosCard = ({ hookValues = {} }) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <motion.div className='about-card glass holographic-card'>
      <div className='card-corner top-left' />
      <div className='card-corner top-right' />
      <div className='card-corner bottom-left' />
      <div className='card-corner bottom-right' />

      <motion.div
        className='byte-floating hologram-effect'
        animate={{
          y: [0, -15, 0],
          filter: [
            'drop-shadow(0 0 15px #00ffea)',
            'drop-shadow(0 0 25px #ff00ff)',
            'drop-shadow(0 0 15px #00ffea)',
          ],
        }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      >
        <ByteHologram currentPhrase={hookValues.currentPhrase} />
      </motion.div>

      <div className='data-metrics'>
        <div className='metric'>
          <span className='metric-label'>SINCRONIZACIÓN</span>
          <span className='metric-value'>REAL-TIME</span>
        </div>
        <div className='metric'>
          <span className='metric-label'>NODOS</span>
          <span className='metric-value'>INTERCONECTADOS</span>
        </div>
        <div className='metric'>
          <span className='metric-label'>BYTE-STATUS</span>
          <span className='metric-value'>STREAMING</span>
        </div>
      </div>

      <motion.p
        className='expansion-text activatable'
        data-id='text1'
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Los <strong className='highlight-text'>flujos de datos</strong> son las venas del
        Pluniverse. Conecta, visualiza y gestiona tus Plubots.
      </motion.p>

      <motion.p
        className='expansion-text activatable'
        data-id='text2'
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        Desde un panel central, orquesta la sinfonía de tus creaciones y colabora en tiempo real.
      </motion.p>

      <motion.button
        className='cyberpunk-button'
        variants={hookValues.buttonVariants}
        whileHover='hover'
        whileTap='tap'
        onClick={() => {
          setShowMore((previous) => !previous);
        }}
      >
        <span className='button-glow' />
        <span className='button-text'>{showMore ? 'CERRAR STREAM' : 'ABRIR STREAM'}</span>
        <div className='button-icon'>{showMore ? '×' : '▶'}</div>
      </motion.button>

      <AnimatePresence>{showMore && <FlujosExpansion showMore={showMore} />}</AnimatePresence>
    </motion.div>
  );
};

FlujosCard.propTypes = flujosCardProperties;

export default FlujosCard;

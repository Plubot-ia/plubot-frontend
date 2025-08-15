import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import AutomatizacionExpansion from './AutomatizacionExpansion';
import ByteHologram from './ByteHologram';

const automatizacionCardProperties = {
  hookValues: PropTypes.shape({
    currentPhrase: PropTypes.string.isRequired,
    buttonVariants: PropTypes.object.isRequired,
  }).isRequired,
};

const AutomatizacionCard = ({ hookValues = {} }) => {
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
          <span className='metric-label'>EFICIENCIA</span>
          <span className='metric-value'>+98%</span>
        </div>
        <div className='metric'>
          <span className='metric-label'>PROCESOS</span>
          <span className='metric-value'>AUTOMATIZADOS</span>
        </div>
        <div className='metric'>
          <span className='metric-label'>BYTE-STATUS</span>
          <span className='metric-value'>OPERATIONAL</span>
        </div>
      </div>

      <motion.p
        className='expansion-text activatable'
        data-id='text1'
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        La <strong className='highlight-text'>automatización</strong> es el núcleo del Pluniverse.
        Convierte tareas repetitivas en flujos inteligentes.
      </motion.p>

      <motion.p
        className='expansion-text activatable'
        data-id='text2'
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        Tu Plubot aprende de tus necesidades y optimiza procesos para maximizar tu eficiencia.
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
        <span className='button-text'>{showMore ? 'CERRAR PROTOCOLO' : 'INICIAR PROTOCOLO'}</span>
        <div className='button-icon'>{showMore ? '×' : '▶'}</div>
      </motion.button>

      <AnimatePresence>{showMore && <AutomatizacionExpansion />}</AnimatePresence>
    </motion.div>
  );
};

AutomatizacionCard.propTypes = automatizacionCardProperties;

export default AutomatizacionCard;

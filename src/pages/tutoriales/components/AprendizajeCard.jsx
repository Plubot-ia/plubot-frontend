import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import AprendizajeExpansion from './AprendizajeExpansion';
import ByteHologram from './ByteHologram';

const aprendizajeCardProperties = {
  hookValues: PropTypes.shape({
    currentPhrase: PropTypes.string.isRequired,
    buttonVariants: PropTypes.object.isRequired,
    expandableContentVariants: PropTypes.object.isRequired,
  }).isRequired,
};

const cyberpunkButtonProperties = {
  showMore: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  variants: PropTypes.object.isRequired,
};

const CyberpunkButton = ({ showMore, onClick, variants }) => (
  <motion.button
    className='cyberpunk-button'
    variants={variants}
    whileHover='hover'
    whileTap='tap'
    onClick={onClick}
  >
    <span className='button-glow' />
    <span className='button-text'>{showMore ? 'CERRAR CONEXIÓN' : 'INICIAR CONEXIÓN'}</span>
    <div className='button-icon'>{showMore ? '×' : '▶'}</div>
  </motion.button>
);

CyberpunkButton.propTypes = cyberpunkButtonProperties;

const AprendizajeCard = ({ hookValues = {} }) => {
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
          <span className='metric-label'>CONOCIMIENTO</span>
          <span className='metric-value'>+120 ZB</span>
        </div>
        <div className='metric'>
          <span className='metric-label'>ADAPTACIÓN</span>
          <span className='metric-value'>CONTINUA</span>
        </div>
        <div className='metric'>
          <span className='metric-label'>BYTE-STATUS</span>
          <span className='metric-value'>LEARNING</span>
        </div>
      </div>

      <motion.p
        className='expansion-text activatable'
        data-id='text1'
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        El <strong className='highlight-text'>aprendizaje</strong> es la clave para la evolución. Tu
        Plubot se adapta a ti, no al revés.
      </motion.p>

      <motion.p
        className='expansion-text activatable'
        data-id='text2'
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        Conéctalo a tus fuentes de datos y observa cómo transforma información en acción
        inteligente.
      </motion.p>

      <CyberpunkButton
        showMore={showMore}
        onClick={() => setShowMore((previous) => !previous)}
        variants={hookValues.buttonVariants}
      />

      <AnimatePresence>
        {showMore && <AprendizajeExpansion variants={hookValues.expandableContentVariants} />}
      </AnimatePresence>
    </motion.div>
  );
};

AprendizajeCard.propTypes = aprendizajeCardProperties;

export default AprendizajeCard;

import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';

const ExpansionExpandedContent = ({
  showMore,
  expandableContentVariants,
  buttonVariants,
  handleNavigation,
}) => (
  <AnimatePresence>
    {showMore && (
      <motion.div
        className='expansion-story'
        variants={expandableContentVariants}
        initial='hidden'
        animate='visible'
        exit='exit'
      >
        <div className='terminal-header'>
          <div className='terminal-icon' />
          <div className='terminal-title'>EXPANSION.PROTOCOL</div>
          <div className='terminal-controls'>
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className='terminal-content'>
          <motion.p className='expansion-text terminal-text'>
            <span className='code-line'>{'>'} Compitiendo en el Coliseo...</span>
            Mide la eficiencia de tu Plubot y gana recompensas para tu expansión.
          </motion.p>

          <motion.p className='expansion-text terminal-text'>
            <span className='code-line'>{'>'} Navegando el PluBazaar...</span>
            Compra poderes con PluCoins o adquiere módulos premium para tu Plubot.
          </motion.p>

          <motion.p className='expansion-text terminal-text'>
            <span className='code-line'>{'>'} Vendiendo creaciones...</span>
            Sube flujos al PluBazaar y genera ingresos pasivos con tus creaciones.
          </motion.p>

          <motion.p className='expansion-text terminal-text'>
            <span className='code-line'>{'>'} Escalando con planes Pro...</span>
            Gestiona equipos y optimiza resultados con múltiples Plubots.
          </motion.p>

          <motion.p className='expansion-text terminal-text'>
            <span className='code-line'>{'>'} Desafíos en el Coliseo...</span>
            Compite, gana medallas y usa tus recompensas para nuevos poderes.
          </motion.p>

          <motion.div
            className='expansion-cta'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <motion.button
              className='cyberpunk-button cta-button'
              variants={buttonVariants}
              whileHover='hover'
              whileTap='tap'
              onClick={() => handleNavigation('/pluniverse/marketplace')}
            >
              <span className='button-glow' />
              VISITA EL PLUBAZAAR
              <div className='button-icon'>▶</div>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

ExpansionExpandedContent.propTypes = {
  showMore: PropTypes.bool.isRequired,
  expandableContentVariants: PropTypes.object.isRequired,
  buttonVariants: PropTypes.object.isRequired,
  handleNavigation: PropTypes.func.isRequired,
};

export default ExpansionExpandedContent;

import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';

const expandableContentVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7 } },
  exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.5 } },
};

const buttonVariants = {
  hover: { scale: 1.08, boxShadow: '0 0 20px rgba(255, 0, 255, 0.8)' },
  tap: { scale: 0.95 },
};

const AutomatizacionExpansion = () => (
  <motion.div
    className='expansion-story'
    variants={expandableContentVariants}
    initial='hidden'
    animate='visible'
    exit='exit'
  >
    <div className='terminal-header'>
      <div className='terminal-icon' />
      <div className='terminal-title'>AUTOMATION.PROTOCOL</div>
      <div className='terminal-controls'>
        <span />
        <span />
        <span />
      </div>
    </div>

    <motion.p className='expansion-text terminal-text'>
      <span className='code-line'>{'>'} Iniciando protocolo de automatización...</span>
      Byte te guía para crear flujos que eliminan el trabajo manual.
    </motion.p>

    <motion.p className='expansion-text terminal-text'>
      <span className='code-line'>{'>'} Analizando procesos...</span>
      Desde correos automáticos hasta integraciones complejas, tu Plubot lo hace posible.
    </motion.p>

    <motion.div
      className='expansion-cta'
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
    >
      <Link to='/welcome'>
        <motion.button
          className='cyberpunk-button cta-button'
          variants={buttonVariants}
          whileHover='hover'
          whileTap='tap'
        >
          <span className='button-glow' />
          COMENZAR AUTOMATIZACIÓN
          <div className='button-icon'>▶</div>
        </motion.button>
      </Link>
    </motion.div>
  </motion.div>
);

export default AutomatizacionExpansion;

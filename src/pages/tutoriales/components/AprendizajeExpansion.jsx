import { motion } from 'framer-motion';
import React from 'react';

const expandableContentVariants = {
  hidden: { opacity: 0, height: 0, y: -20 },
  visible: {
    opacity: 1,
    height: 'auto',
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -20,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const buttonVariants = {
  hover: { scale: 1.08, boxShadow: '0 0 20px rgba(255, 0, 255, 0.8)' },
  tap: { scale: 0.95 },
};

const AprendizajeExpansion = () => (
  <motion.div
    className='expansion-story-aprendizaje'
    variants={expandableContentVariants}
    initial='hidden'
    animate='visible'
    exit='exit'
  >
    <div className='terminal-header'>
      <div className='terminal-icon' />
      <div className='terminal-title'>LEARNING.PROTOCOL</div>
      <div className='terminal-controls'>
        <span />
        <span />
        <span />
      </div>
    </div>

    <motion.p className='expansion-text terminal-text'>
      <span className='code-line'>{'>'} Iniciando protocolo de aprendizaje...</span>
      La Academia te guía para entrenar a tu Plubot con nuevas habilidades.
    </motion.p>

    <motion.p className='expansion-text terminal-text'>
      <span className='code-line'>{'>'} Cargando tutoriales interactivos...</span>
      Explora cursos en video y guías paso a paso para dominar flujos e integraciones.
    </motion.p>

    <motion.p className='expansion-text terminal-text'>
      <span className='code-line'>{'>'} Conectando con la comunidad...</span>
      Únete al PluForum para compartir ideas, resolver dudas y descubrir hacks.
    </motion.p>

    <motion.p className='expansion-text terminal-text'>
      <span className='code-line'>{'>'} Desbloqueando certificaciones...</span>
      Obtén credenciales como “Constructor de Flujos” para destacar en el Pluniverse.
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
        onClick={() => {
          globalThis.location.href = '/pluniverse/academy';
        }}
      >
        <span className='button-glow' />
        EXPLORA LA ACADEMIA
        <div className='button-icon'>▶</div>
      </motion.button>
    </motion.div>
  </motion.div>
);

export default AprendizajeExpansion;

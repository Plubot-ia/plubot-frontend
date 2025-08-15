import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

const expandableContentVariants = {
  hidden: { opacity: 0, height: 0, y: -20 },
  visible: {
    opacity: 1,
    height: 'auto',
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -20,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

const buttonVariants = {
  hover: {
    scale: 1.05,
    boxShadow: '0 0 15px rgba(0, 255, 255, 0.8)',
    textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
  },
  tap: { scale: 0.95 },
};

const TutorialesExpandedContent = ({ showMore }) => (
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
          <div className='terminal-title'>BYTE.DATA.LOG</div>
          <div className='terminal-controls'>
            <span />
            <span />
            <span />
          </div>
        </div>

        <motion.p className='expansion-text terminal-text'>
          <span className='code-line'>{'>'} Iniciando secuencia de datos...</span>
          Diseñado en el núcleo del Pluniverse, Byte fue creado para guiar a los nuevos creadores.
        </motion.p>

        <motion.p className='expansion-text terminal-text'>
          <span className='code-line'>{'>'} Analizando registros de usuario...</span>A su lado, tu
          Plubot evoluciona. Aprende. Crece. Domina flujos y automatizaciones.
        </motion.p>

        <motion.div className='byte-capabilities'>
          <Link to='/tutoriales/automatizacion' className='capability'>
            <div className='capability-icon automation' />
            <div className='capability-name'>AUTOMATIZACIÓN</div>
          </Link>
          <Link to='/tutoriales/aprendizaje' className='capability'>
            <div className='capability-icon learning' />
            <div className='capability-name'>APRENDIZAJE</div>
          </Link>
          <Link to='/tutoriales/flujos' className='capability'>
            <div className='capability-icon workflow' />
            <div className='capability-name'>FLUJOS</div>
          </Link>
          <Link to='/tutoriales/expansion' className='capability'>
            <div className='capability-icon expansion' />
            <div className='capability-name'>EXPANSIÓN</div>
          </Link>
        </motion.div>

        <motion.p className='expansion-text-glow'>
          <span className='code-line'>{'>'} Mensaje del Pluniverse:</span>
          &quot;El Pluniverse se construye con cada flujo que activas.&quot;
        </motion.p>

        <motion.div
          className='create-plubot-cta'
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Link to='/faq'>
            <motion.button
              className='cyberpunk-button cta-button'
              variants={buttonVariants}
              whileHover='hover'
              whileTap='tap'
            >
              <span className='button-glow' />
              VER PREGUNTAS FRECUENTES
              <div className='button-icon'>▶</div>
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

TutorialesExpandedContent.propTypes = {
  showMore: PropTypes.bool.isRequired,
};

export default TutorialesExpandedContent;

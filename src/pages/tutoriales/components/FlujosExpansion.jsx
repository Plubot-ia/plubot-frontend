import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';

const expandableContentVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7 } },
  exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.5 } },
};

const FlujosExpansion = ({ showMore }) => (
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
          <div className='terminal-title'>FLOW.PROTOCOL</div>
          <div className='terminal-controls'>
            <span />
            <span />
            <span />
          </div>
        </div>

        <motion.p className='expansion-text terminal-text'>
          <span className='code-line'>{'>'} Definiendo nodos...</span>
          Nodos son los bloques básicos de un flujo: acciones, condiciones o integraciones.
        </motion.p>

        <motion.p className='expansion-text terminal-text'>
          <span className='code-line'>{'>'} Construyendo flujos...</span>
          Un flujo conecta nodos para definir el comportamiento de tu Plubot, como saludar o
          procesar pagos.
        </motion.p>

        <motion.p className='expansion-text terminal-text'>
          <span className='code-line'>{'>'} Estableciendo conexiones...</span>
          Usa el sistema drag-and-drop del PluLab para conectar nodos y crear lógica personalizada.
        </motion.p>

        <motion.p className='expansion-text terminal-text'>
          <span className='code-line'>{'>'} Activando poderes...</span>
          Integra herramientas como WhatsApp, Stripe o MercadoPago para potenciar tu Plubot.
        </motion.p>

        <motion.p className='expansion-text terminal-text'>
          <span className='code-line'>{'>'} Construyendo un flujo...</span>
          En el PluLab, arrastra nodos y conéctalos para crear flujos que puedes probar en tiempo
          real.
        </motion.p>

        <motion.p className='expansion-text terminal-text'>
          <span className='code-line'>{'>'} Conectando WhatsApp...</span>
          Usa el módulo de WhatsApp para que tu Plubot chatee con clientes en minutos.
        </motion.p>
      </motion.div>
    )}
  </AnimatePresence>
);

FlujosExpansion.propTypes = {
  showMore: PropTypes.bool.isRequired,
};

export default FlujosExpansion;

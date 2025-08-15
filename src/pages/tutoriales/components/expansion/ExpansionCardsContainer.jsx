import { motion } from 'framer-motion';
import React from 'react';

const ExpansionCardsContainer = () => (
  <div className='tutorials-expansion-cards'>
    <motion.div
      className='expansion-card activatable'
      data-id='card1'
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className='card-icon marketplace' />
      <h3 className='card-title'>PluBazaar</h3>
      <p className='card-description'>Vende y compra flujos en el mercado de la comunidad.</p>
    </motion.div>
    <motion.div
      className='expansion-card activatable'
      data-id='card2'
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className='card-icon coliseum' />
      <h3 className='card-title'>Coliseo</h3>
      <p className='card-description'>Compite por la máxima eficiencia y gana recompensas.</p>
    </motion.div>
    <motion.div
      className='expansion-card activatable'
      data-id='card3'
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <div className='card-icon premium' />
      <h3 className='card-title'>Poderes Premium</h3>
      <p className='card-description'>Desbloquea capacidades avanzadas para tu Plubot.</p>
    </motion.div>
  </div>
);

export default ExpansionCardsContainer;

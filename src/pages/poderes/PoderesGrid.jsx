import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { powers } from './powers-data';

const PoderesGrid = () => {
  const [selectedPower, setSelectedPower] = useState();

  return (
    <>
      <section className='poderes-grid'>
        {powers.map((power) => (
          <motion.div
            key={power.id}
            className='power-card'
            role='button'
            tabIndex={0}
            onClick={() => setSelectedPower(power)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                setSelectedPower(power);
              }
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: power.id * 0.2 }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 20px rgba(0, 224, 255, 0.7)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <div className='power-icon'>{power.icon}</div>
            <h3>{power.title}</h3>
            <p>{power.description}</p>
          </motion.div>
        ))}
      </section>

      {selectedPower && (
        <div
          className='power-modal-overlay'
          role='button'
          tabIndex='0'
          onClick={() => setSelectedPower(undefined)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              setSelectedPower(undefined);
            }
          }}
        >
          <motion.div
            className='power-modal'
            role='dialog'
            aria-modal='true'
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <button className='close-modal-btn' onClick={() => setSelectedPower(undefined)}>
              ×
            </button>
            <div className='modal-icon'>{selectedPower.icon}</div>
            <h2>{selectedPower.title}</h2>
            <p>{selectedPower.detailedDescription}</p>
            <Link to='/pluniverse/marketplace' className='modal-button'>
              Desbloquear Poder
            </Link>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default PoderesGrid;

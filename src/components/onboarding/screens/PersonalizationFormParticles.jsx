/**
 * PersonalizationFormParticles.jsx - Componentes de partículas para PersonalizationForm
 */
import Particles from '@tsparticles/react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

import { particlesOptions } from './PersonalizationFormParticlesUtilities';

/**
 * Componente de partículas de fondo
 */
export const BackgroundParticles = ({ particlesInit }) => (
  <Particles id='tsparticles' init={particlesInit} options={particlesOptions} />
);

BackgroundParticles.propTypes = {
  particlesInit: PropTypes.func.isRequired,
};

/**
 * Componente de efectos de partículas animadas para personalidad
 */
export const PersonalityParticleEffect = ({ showParticleEffect }) => (
  <AnimatePresence>
    {showParticleEffect && (
      <motion.div
        className='personality-particles'
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5 }}
      >
        {Array.from({ length: 10 }).map((_, index) => {
          // Sistema determinístico configurable: más predecible, testeable y mantenible
          const seedFactor = (index * 19 + 37) % 360; // 0-359 para ángulos

          return (
            <div
              key={`particle-${seedFactor}-${index * 19 + 37}`}
              className='absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping'
              style={{
                // Ángulo determinístico con distribución uniforme
                '--angle': `${seedFactor}deg`,
                // Distancia determinística
                '--distance': `${40 + (seedFactor % 40)}%`, // 40% a 79%
                // Tamaño determinístico
                '--size': `${5 + (seedFactor % 8)}px`, // 5px a 12px
                backgroundColor: '#00e0ff',
              }}
            />
          );
        })}
      </motion.div>
    )}
  </AnimatePresence>
);

PersonalityParticleEffect.propTypes = {
  showParticleEffect: PropTypes.bool.isRequired,
};

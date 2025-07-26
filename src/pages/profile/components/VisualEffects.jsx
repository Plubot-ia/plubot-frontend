import React from 'react';

import useVisualEffects from '../hooks/useVisualEffects.jsx';

import CosmicLights from './CosmicLights';
import GridLines from './GridLines';
import Particles from './Particles';

const VisualEffects = () => {
  const {
    particlesReference,
    gridLinesReference,
    cosmicLightsReference,
    particlesVisible,
    gridLinesVisible,
    cosmicLightsVisible,
    particleCount,
  } = useVisualEffects();

  return (
    <>
      <div ref={particlesReference} className='particles'>
        <Particles isVisible={particlesVisible} count={particleCount} />
      </div>

      <div ref={gridLinesReference} className='grid-lines'>
        <GridLines isVisible={gridLinesVisible} />
      </div>

      <div ref={cosmicLightsReference} className='cosmic-lights'>
        <CosmicLights isVisible={cosmicLightsVisible} />
      </div>

      <div className='scanlines' />
      <div className='glitch-effect' />
    </>
  );
};

export default React.memo(VisualEffects);

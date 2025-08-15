import React, { useRef } from 'react';

import AprendizajeCard from './components/AprendizajeCard';
import DigitalCursor from './components/DigitalCursor';
import useAprendizajeEffects from './hooks/useAprendizajeEffects';
import useTutorialFlujos from './hooks/useTutorialFlujos';
import './TutorialesAprendizaje.css';

const TutorialesAprendizaje = () => {
  const containerReference = useRef(null);
  const { cursorPosition, isHovering } = useTutorialFlujos(containerReference);
  const hookValues = useAprendizajeEffects();

  return (
    <div className='tutoriales-page about-wrapper' ref={containerReference}>
      <div className='scanner-line' />
      <DigitalCursor position={cursorPosition} isHovering={isHovering} />
      <div className='about-container'>
        <div className='glitch-title cyberpunk-text'>
          <span className='cyber-bracket'>[</span>
          Aprendizaje Continuo
          <span className='cyber-bracket'>]</span>
        </div>

        <div className='digital-badge'>Protocolo de Evolución Activo</div>

        <AprendizajeCard hookValues={hookValues} />

        <div className='interface-elements'>
          <div className='interface-dot' />
          <div className='interface-dot' />
          <div className='interface-dot' />
        </div>
      </div>
    </div>
  );
};

export default TutorialesAprendizaje;

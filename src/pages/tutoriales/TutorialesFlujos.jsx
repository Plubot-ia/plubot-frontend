import React from 'react';

import DigitalCursor from './components/DigitalCursor';
import FlujosCard from './components/FlujosCard';
import useTutorialFlujos from './hooks/useTutorialFlujos';
import './TutorialesFlujos.css';

const TutorialesFlujos = () => {
  const hookValues = useTutorialFlujos();

  return (
    <div className='tutoriales-page about-wrapper' ref={hookValues.containerReference}>
      <div className='scanner-line' />
      <DigitalCursor position={hookValues.cursorPosition} isHovering={hookValues.isHovering} />
      <div className='about-container'>
        <div className='glitch-title cyberpunk-text'>
          <span className='cyber-bracket'>[</span>
          Tutorial de Flujos
          <span className='cyber-bracket'>]</span>
        </div>

        <div className='digital-badge'>Protocolo de Automatización Activo</div>

        <FlujosCard hookValues={hookValues} />

        <div className='interface-elements'>
          <div className='interface-dot' />
          <div className='interface-dot' />
          <div className='interface-dot' />
        </div>
      </div>
    </div>
  );
};

export default TutorialesFlujos;

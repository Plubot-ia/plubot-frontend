import React from 'react';

import AutomatizacionCard from './components/AutomatizacionCard';
import useTutorialAutomatizacion from './hooks/useTutorialAutomatizacion';

import './TutorialesAutomatizacion.css';

const TutorialesAutomatizacion = () => {
  const hookValues = useTutorialAutomatizacion();

  return (
    <div className='tutoriales-page about-wrapper' ref={hookValues.containerReference}>
      <div className='scanner-line' />
      <div className='about-container'>
        <div className='glitch-title cyberpunk-text'>
          <span className='cyber-bracket'>[</span>
          Automatización
          <span className='cyber-bracket'>]</span>
        </div>

        <div className='digital-badge'>Protocolo de Eficiencia Activo</div>

        <AutomatizacionCard hookValues={hookValues} />

        <div className='interface-elements'>
          <div className='interface-dot' />
          <div className='interface-dot' />
          <div className='interface-dot' />
        </div>
      </div>
    </div>
  );
};

export default TutorialesAutomatizacion;

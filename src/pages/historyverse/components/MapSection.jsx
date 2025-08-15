import PropTypes from 'prop-types';
import React from 'react';

import mapImg from '@assets/img/pluniverse-map-full.webp';

const MapSection = ({ zones, selectedZone, onVisitZone }) => (
  <section className='historyverse-map-zone'>
    <h2 className='section-title'>Explorá las zonas</h2>
    <div className='map-container'>
      <img src={mapImg} alt='Mapa del Pluniverse' className='map-img' />
      <div className='map-hotspots'>
        {zones.map((zone) => (
          <button
            key={zone.id}
            type='button'
            className={`interactive-button-reset hotspot ${zone.id} ${selectedZone === zone.id ? 'active' : ''}`}
            onClick={() => onVisitZone(zone.id)}
          >
            <div className='pulse' />
            <div className='hotspot-tooltip'>
              <h4>{zone.name}</h4>
              <p>{zone.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  </section>
);

MapSection.propTypes = {
  zones: PropTypes.array.isRequired,
  selectedZone: PropTypes.string,
  onVisitZone: PropTypes.func.isRequired,
};

MapSection.defaultProps = {
  selectedZone: undefined,
};

export default MapSection;

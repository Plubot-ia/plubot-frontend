import { useNavigate } from 'react-router-dom';

import pluniverseMap from '@assets/img/pluniverse-map.webp';

import './PluniverseDashboard.css';

const PluniverseDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className='pluniverse-dashboard' style={{ backgroundImage: `url(${pluniverseMap})` }}>
      <h1 className='dashboard-title'>Bienvenido al Pluniverse</h1>
      <div className='map-container'>
        <div className='map-overlay'>
          <button className='map-region factory' onClick={() => navigate('/pluniverse/factory')}>
            Fábrica de Bots
          </button>
          <button className='map-region academy' onClick={() => navigate('/pluniverse/academy')}>
            Academia de Automatización
          </button>
          <button
            className='map-region marketplace'
            onClick={() => navigate('/pluniverse/marketplace')}
          >
            Mercado de Extensiones
          </button>
          <button className='map-region coliseum' onClick={() => navigate('/pluniverse/coliseum')}>
            Coliseo de Productividad
          </button>
          <button className='map-region tower' onClick={() => navigate('/pluniverse/tower')}>
            Torre de Creativos
          </button>
          <button
            className='map-region sanctuary'
            onClick={() => navigate('/pluniverse/sanctuary')}
          >
            Santuario del Fundador
          </button>
        </div>
      </div>
    </div>
  );
};

export default PluniverseDashboard;

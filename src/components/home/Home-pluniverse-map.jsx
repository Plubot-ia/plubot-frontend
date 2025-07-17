import { Link } from 'react-router-dom';

import './Home-pluniverse-map.css';

const HomePluniverseMap = () => (
  <section className='pluniverse-map'>
    <h2>Navega el Pluniverse</h2>
    <div className='map-container'>
      <Link to='/pluniverse/tower' className='map-zone plutower'>
        PluTower
      </Link>
      <Link to='/pluniverse/academy' className='map-zone plulab'>
        PluLab
      </Link>
      <Link to='/pluniverse/coliseum' className='map-zone coliseum'>
        Coliseo
      </Link>
      <Link to='/pluniverse/marketplace' className='map-zone plubazaar'>
        PluBazaar
      </Link>
    </div>
  </section>
);

export default HomePluniverseMap;

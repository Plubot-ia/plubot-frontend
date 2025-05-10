import { Link } from 'react-router-dom';
import pluniverseMap from '/src/assets/img/pluniverse-map.webp';
import './Home-pluniverse-map.css';

const HomePluniverseMap = () => {
  return (
    <section className="pluniverse-map">
      <h2>Navega el Pluniverse</h2>
      <div className="map-container" style={{ backgroundImage: `url(${pluniverseMap})` }}>
        <Link to="/pluniverse/tower" className="map-zone plutower">PluTower</Link>
        <Link to="/pluniverse/academy" className="map-zone plulab">PluLab</Link>
        <Link to="/pluniverse/coliseum" className="map-zone coliseum">Coliseo</Link>
        <Link to="/pluniverse/marketplace" className="map-zone plubazaar">PluBazaar</Link>
      </div>
    </section>
  );
};

export default HomePluniverseMap;
import { Link } from 'react-router-dom';
import './Home-cosmic-call.css';

const HomeCosmicCall = () => {
  return (
    <section className='cosmic-call'>
      <div className='call-overlay'>
        <h2>¿Cuál es tu destino?</h2>
        <div className='call-cta'>
          <Link to='/welcome' className='hero-button'>
            Forjar mi Plubot
          </Link>
          <Link to='/pluniverse' className='hero-button secondary'>
            Explorar el Cosmos
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeCosmicCall;

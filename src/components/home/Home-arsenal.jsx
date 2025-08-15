import { Link } from 'react-router-dom';
import './Home-arsenal.css';

const HomeArsenal = () => {
  return (
    <section className='plubot-arsenal'>
      <h2>Tu Arsenal</h2>
      <div className='arsenal-container'>
        <div className='arsenal-card'>
          <h3>Iniciado</h3>
          <p>Plubot básico para explorar.</p>
          <Link to='/plans' className='arsenal-button'>
            Seleccionar
          </Link>
        </div>
        <div className='arsenal-card'>
          <h3>Maestro</h3>
          <p>Poderes avanzados y PluCoins.</p>
          <Link to='/plans' className='arsenal-button'>
            Seleccionar
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeArsenal;

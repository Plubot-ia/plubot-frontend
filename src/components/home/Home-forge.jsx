import { Link } from 'react-router-dom';
import './Home-forge.css';

const HomeForge = () => {
  return (
    <section className='plubot-forge'>
      <h2>Forja tu Plubot</h2>
      <div className='forge-container'>
        <div className='forge-card'>
          <h3>1. Elige tu Núcleo</h3>
          <p>Selecciona una plantilla para tu visión.</p>
        </div>
        <div className='forge-card'>
          <h3>2. Infunde tu Esencia</h3>
          <p>Personaliza nombre y estilo.</p>
        </div>
        <div className='forge-card'>
          <h3>3. Conecta la Galaxia</h3>
          <p>Enlaza con WhatsApp al instante.</p>
        </div>
      </div>
      <Link to='/welcome' className='forge-cta'>
        Forjar Ahora
      </Link>
    </section>
  );
};

export default HomeForge;

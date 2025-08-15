import { NavLink } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <section className='notfound-section'>
      <div className='notfound-container'>
        <h1 className='notfound-title'>404 - Página No Encontrada</h1>
        <p className='notfound-message'>
          Lo sentimos, parece que te has perdido en el Pluniverso. La página que buscas no existe o
          ha sido absorbida por un agujero negro digital.
        </p>
        <NavLink to='/' className='notfound-link'>
          Volver al Inicio
        </NavLink>
      </div>
    </section>
  );
};

export default NotFound;

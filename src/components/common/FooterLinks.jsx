import { NavLink } from 'react-router-dom';

const scrollToTop = () => {
  setTimeout(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, 100);
};

const PluniverseLinks = () => (
  <div className='footer-links'>
    <h3>Explora el Pluniverse</h3>
    <div className='footer-links-columns'>
      <ul className='footer-links-column'>
        <li>
          <NavLink to='/' onClick={scrollToTop}>
            Inicio
          </NavLink>
        </li>
        <li>
          <NavLink to='/pluniverse' onClick={scrollToTop}>
            Pluniverse
          </NavLink>
        </li>
        <li>
          <NavLink to='/sanctuary' onClick={scrollToTop}>
            Santuario del Fundador
          </NavLink>
        </li>
        <li>
          <NavLink to='/tutoriales' onClick={scrollToTop}>
            Tutoriales
          </NavLink>
        </li>
        <li>
          <NavLink to='/contact' onClick={scrollToTop}>
            Contacto
          </NavLink>
        </li>
      </ul>
      <ul className='footer-links-column'>
        <li>
          <NavLink to='/register' onClick={scrollToTop}>
            Registrarse
          </NavLink>
        </li>
        <li>
          <NavLink to='/login' onClick={scrollToTop}>
            Iniciar Sesión
          </NavLink>
        </li>
        <li>
          <NavLink to='/blog' onClick={scrollToTop}>
            Blog
          </NavLink>
        </li>
        <li>
          <NavLink to='/faq' onClick={scrollToTop}>
            Preguntas Frecuentes
          </NavLink>
        </li>
        <li>
          <NavLink to='/coliseum' onClick={scrollToTop}>
            Comunidad
          </NavLink>
        </li>
      </ul>
    </div>
  </div>
);

const LegalLinks = () => (
  <div className='footer-legal'>
    <h3>Legal</h3>
    <ul>
      <li>
        <NavLink to='/terms' onClick={scrollToTop}>
          Términos y Condiciones
        </NavLink>
      </li>
      <li>
        <NavLink to='/privacy' onClick={scrollToTop}>
          Política de Privacidad
        </NavLink>
      </li>
      <li>
        <NavLink to='/seguridad' onClick={scrollToTop}>
          Seguridad
        </NavLink>
      </li>
    </ul>
  </div>
);

const FooterLinks = () => (
  <>
    <PluniverseLinks />
    <LegalLinks />
  </>
);

export default FooterLinks;

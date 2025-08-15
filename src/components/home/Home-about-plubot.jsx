import { Link } from 'react-router-dom';

import homeHero2 from '../../assets/img/home/homehero2/homehero2.webp';
import LazyImage from '../common/LazyImage';

import './Home-about-plubot.css';

const HomeAboutPlubot = () => (
  <section className='plubot-core'>
    <div className='split-container'>
      <div className='split-visual'>
        <LazyImage
          src={homeHero2}
          alt='¿Qué es Plubot?'
          className='core-plubot'
          width='600'
          height='400'
        />
      </div>
      <div className='split-text'>
        <h2>¿Qué es Plubot?</h2>
        <p>
          ¿Te imaginás tener alguien que conteste tus mensajes, atienda a tus clientes y mantenga
          todo en orden... sin que vos hagas nada? Eso es Plubot. Un pequeño robot que vos mismo
          creás, configurás y soltás al mundo para trabajar por vos.
        </p>
        <p>
          Se conecta con WhatsApp, aprende lo que necesitás, y te libera de lo repetitivo. Porque el
          tiempo es tu recurso más valioso.
        </p>
        <Link to='/about-plubot' className='plubot-hero-button secondary'>
          Descubrir más
        </Link>
      </div>
    </div>
  </section>
);

export default HomeAboutPlubot;

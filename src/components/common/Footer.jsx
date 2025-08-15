import { NavLink } from 'react-router-dom';

import './Footer.css';

import logo from '@assets/img/logo.svg';
import facebookIcon from '@assets/img/social/facebook.svg';
import instagramIcon from '@assets/img/social/instagram.svg';
import threadsIcon from '@assets/img/social/threads.svg';
import xIcon from '@assets/img/social/x.svg';

import FooterLinks from './FooterLinks';
import FooterSubscriptionForm from './FooterSubscriptionForm';

const Footer = () => {
  return (
    <footer className='quantum-footer'>
      <div className='footer-container'>
        <div className='footer-brand'>
          <img src={logo} alt='Plubot Logo' className='footer-logo' />
          <p className='footer-tagline'>
            <span>Plubot: Tu aliado en el Pluniverse</span>
            <br />
            <span>Automatiza, crea, vive sin límites.</span>
          </p>
        </div>
        <FooterLinks />
        <div className='footer-social'>
          <h3>Conecta con Nosotros</h3>
          <div className='social-icons'>
            <a
              href='https://instagram.com/plubot'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Instagram'
            >
              <img src={instagramIcon} alt='Instagram' className='social-icon-img' />
            </a>
            <a
              href='https://facebook.com/plubot'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Facebook'
            >
              <img src={facebookIcon} alt='Facebook' className='social-icon-img' />
            </a>
            <a
              href='https://threads.net/plubot'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Threads'
            >
              <img src={threadsIcon} alt='Threads' className='social-icon-img' />
            </a>
            <a href='https://x.com/plubot' target='_blank' rel='noopener noreferrer' aria-label='X'>
              <img src={xIcon} alt='X' className='social-icon-img' />
            </a>
          </div>
          <NavLink
            to='/tu-opinion'
            className='opinion-link'
            aria-label='Ir a la página de opiniones'
          >
            Tu opinión nos importa
          </NavLink>
        </div>
      </div>
      <FooterSubscriptionForm />
      <div className='footer-bottom'>
        <p> 2025 Plubot Web. Forjado en el corazón del Pluniverse.</p>
      </div>
    </footer>
  );
};

export default Footer;

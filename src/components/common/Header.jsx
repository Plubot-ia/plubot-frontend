import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

import logo from '@assets/img/logo.header.svg';

import './Header.css';
import useAuthStore from '../../stores/use-auth-store';

import NavLinks from './NavLinks';
import UserProfile from './UserProfile';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <nav className='navbar' role='navigation'>
        <div className='logo'>
          <NavLink to='/' aria-label='Ir a la página de inicio de Plubot' onClick={closeMenu}>
            <span className='logo-text'>PLUBOT</span>
            <img src={logo} alt='Plubot Logo' className='logo-image loaded' />
          </NavLink>
        </div>

        <button
          className='menu-toggle'
          aria-label='Abrir o cerrar el menú de navegación'
          aria-expanded={isOpen}
          onClick={toggleMenu}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <NavLinks activeClassName={isOpen ? 'active' : ''} onLinkClick={closeMenu} />

        <div className={`auth-section ${isOpen ? 'active' : ''}`}>
          {isAuthenticated ? (
            <UserProfile onLinkClick={closeMenu} />
          ) : (
            <NavLink to='/login' className='auth-button glowing' onClick={closeMenu}>
              Acceder / Registrarse
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;

import { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { GamificationContext } from '../../context/GamificationContext';
import {
  Home,
  Bot,
  Globe,
  Zap,
  Gem,
  Users,
  MessageCircle,
  Menu,
  X
} from 'lucide-react';

import logo from '@assets/img/logo.header.svg';
import './Header.css';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { pluCoins, level } = useContext(GamificationContext);
  const navigate = useNavigate();

  const toggleMenu = () => {
    console.log('Toggle menu clicked, isOpen:', !isOpen);
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    console.log('Closing menu, isOpen: false');
    setIsOpen(false);
  };

  const handleLinkInteraction = (e, to) => {
    console.log(`Link clicked: type=${e.type}, target=${to}`);
    closeMenu();
  };

  const handleProfileToggle = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      navigate('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  useEffect(() => {
    const handleScroll = (event) => {
      const target = event.currentTarget;
      const scrollY = target === window ? window.scrollY : target.scrollTop;
      console.log('Scroll detected', {
        scrollY,
        target: target === window ? 'window' : target.className || target.tagName,
        scrollHeight: target.scrollHeight,
        clientHeight: target.clientHeight
      });
      const scrolled = scrollY > 10;
      console.log('Setting isScrolled:', scrolled);
      setIsScrolled(scrolled);
    };

    // Lista de posibles contenedores desplazables
    const possibleContainers = [
      document.querySelector('.app-container'),
      document.querySelector('.main-content'),
      document.querySelector('main'),
      document.querySelector('div[style*="overflow-y"]'),
      document.querySelector('.container'), // Añadido por si usas un contenedor genérico
      document.body,
      window
    ].filter(Boolean); // Filtra nulos

    let scrollTarget = null;
    for (const container of possibleContainers) {
      const isScrollable =
        container !== window &&
        container.scrollHeight > container.clientHeight &&
        (getComputedStyle(container).overflowY === 'auto' ||
          getComputedStyle(container).overflowY === 'scroll');
      console.log('Checking container:', {
        element: container === window ? 'window' : container.className || container.tagName,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        overflowY: container !== window ? getComputedStyle(container).overflowY : 'N/A',
        isScrollable
      });
      if (container === window || isScrollable) {
        scrollTarget = container;
        break;
      }
    }

    if (!scrollTarget) {
      console.warn('No scrollable container found, defaulting to window');
      scrollTarget = window;
    }

    console.log('Scroll listener added to:', scrollTarget === window ? 'window' : scrollTarget.className || scrollTarget.tagName);
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      console.log('Scroll listener removed from:', scrollTarget === window ? 'window' : scrollTarget.className || scrollTarget.tagName);
      scrollTarget.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <nav className="navbar" role="navigation">
        <div className="logo">
          <NavLink
            to="/"
            aria-label="Ir a la página de inicio de Plubot"
            role="link"
            tabIndex={0}
            onClick={(e) => handleLinkInteraction(e, '/')}
          >
            <span className="logo-text">PLUBOT</span>
            <img
              src={logo}
              alt="Plubot Logo"
              className={`logo-image ${isLogoLoaded ? 'loaded' : ''}`}
              onLoad={() => setIsLogoLoaded(true)}
            />
          </NavLink>
        </div>

        <button
          className="menu-toggle"
          aria-label="Abrir o cerrar el menú de navegación"
          aria-expanded={isOpen}
          onClick={toggleMenu}
          onTouchStart={toggleMenu}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul className={`nav-links ${isOpen ? 'active' : ''}`}>
          <li>
            <NavLink
              to="/"
              end
              role="link"
              tabIndex={0}
              onClick={(e) => handleLinkInteraction(e, '/')}
            >
              <Home size={18} className="nav-icon" /> Inicio
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/plubot/create"
              className="tight-text"
              role="link"
              tabIndex={0}
              onClick={(e) => handleLinkInteraction(e, '/plubot/create')}
            >
              <Bot size={18} className="nav-icon" /> Crea tu Plubot
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pluniverse"
              role="link"
              tabIndex={0}
              onClick={(e) => handleLinkInteraction(e, '/pluniverse')}
            >
              <Globe size={18} className="nav-icon" /> Pluniverse
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/poderes"
              role="link"
              tabIndex={0}
              onClick={(e) => handleLinkInteraction(e, '/poderes')}
            >
              <Zap size={18} className="nav-icon" /> Poderes
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/plans"
              role="link"
              tabIndex={0}
              onClick={(e) => handleLinkInteraction(e, '/plans')}
            >
              <Gem size={18} className="nav-icon" /> Planes
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pluniverse/coliseum"
              role="link"
              tabIndex={0}
              onClick={(e) => handleLinkInteraction(e, '/pluniverse/coliseum')}
            >
              <Users size={18} className="nav-icon" /> Comunidad
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              role="link"
              tabIndex={0}
              onClick={(e) => handleLinkInteraction(e, '/contact')}
            >
              <MessageCircle size={18} className="nav-icon" /> Contacto
            </NavLink>
          </li>
        </ul>

        <div className={`auth-section ${isOpen ? 'active' : ''}`}>
          {console.log('Header: isAuthenticated=', isAuthenticated, 'user=', user)}
          {isAuthenticated ? (
            <div className="user-profile">
              <div
                className="profile-icon"
                onClick={handleProfileToggle}
                role="button"
                tabIndex={0}
                aria-label="Abrir menú de perfil"
              >
                <span>{user && user.name ? user.name.charAt(0) : 'U'}</span>
              </div>
              {isProfileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-info">
                    <p>{user && user.name ? user.name : 'Usuario'}</p>
                    <p>{user && user.email ? user.email : ''}</p>
                  </div>
                  <div className="profile-stats">
                    <p>Nivel: {level}</p>
                    <p>PluCoin: {pluCoins}</p>
                  </div>
                  <NavLink
                    to="/auth/change-password"
                    className="profile-link"
                    onClick={(e) => handleLinkInteraction(e, '/auth/change-password')}
                  >
                    Cambiar Contraseña
                  </NavLink>
                  <NavLink
                    to="/profile"
                    className="profile-link"
                    onClick={(e) => handleLinkInteraction(e, '/profile')}
                  >
                    Ver Perfil
                  </NavLink>
                  <button onClick={handleLogout} className="logout-btn">
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink
              to="/auth/login"
              className="auth-button glowing"
              role="link"
              tabIndex={0}
              onClick={(e) => handleLinkInteraction(e, '/auth/login')}
            >
              Acceder / Registrarse
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
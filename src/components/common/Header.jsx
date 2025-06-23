import { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { GamificationContext } from '../../context/GamificationContext';
import useAuthStore from '../../stores/useAuthStore';
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
  const { user, isAuthenticated, logout } = useAuthStore();
  const { pluCoins, level } = useContext(GamificationContext);
  const navigate = useNavigate();
  
  // Cargar el logo
  useEffect(() => {
    const img = new Image();
    img.src = logo;
    img.onload = () => setIsLogoLoaded(true);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLinkInteraction = (e, to) => {
    closeMenu();
  };

  const handleProfileToggle = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleLogout = () => {
    // Cerrar el perfil desplegable inmediatamente para feedback visual
    setIsProfileOpen(false);
    
    // Ejecutar el logout de forma síncrona para garantizar que se limpien los datos
    // La función logout ha sido mejorada para ser rápida y no bloqueante
    logout();
    
    // Redirigir a la página de inicio
    navigate('/', { replace: true });
    
    // Forzar recarga de la página para limpiar completamente el estado
    // Esto garantiza que no queden residuos de la sesión anterior
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  useEffect(() => {
    const handleScroll = (event) => {
      const target = event.currentTarget;
      const scrollY = target === window ? window.scrollY : target.scrollTop;
      const scrolled = scrollY > 10;
      setIsScrolled(scrolled);
    };

    // Lista de posibles contenedores desplazables
    const possibleContainers = [
      document.querySelector('.app-container'),
      document.querySelector('.main-content'),
      document.querySelector('main'),
      document.querySelector('div[style*="overflow-y"]'),
      document.querySelector('.container'),
      document.body,
      window
    ].filter(Boolean);

    let scrollTarget = null;
    for (const container of possibleContainers) {
      const isScrollable =
        container !== window &&
        container.scrollHeight > container.clientHeight &&
        (getComputedStyle(container).overflowY === 'auto' ||
          getComputedStyle(container).overflowY === 'scroll');
      
      if (container === window || isScrollable) {
        scrollTarget = container;
        break;
      }
    }

    // Si no se encontró un contenedor desplazable, usar window por defecto
    if (!scrollTarget) {
      scrollTarget = window;
    }

    // Añadir listener de scroll al contenedor encontrado
    if (scrollTarget) {
      scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Limpiar el listener al desmontar
    return () => {
      if (scrollTarget) {
        scrollTarget.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isScrolled]);

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
              to="/welcome"
              className="tight-text"
              role="link"
              tabIndex={0}
              onClick={(e) => handleLinkInteraction(e, '/welcome')}
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
              to="/coliseum"
              role="link"
              tabIndex={0}
              onClick={(e) => handleLinkInteraction(e, '/coliseum')}
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
                    <p>{user && user.name ? user.name : localStorage.getItem('current_user_name') || 'Usuario'}</p>
                    <p>{localStorage.getItem('current_user_email') || (user && user.email) || ''}</p>
                  </div>
                  <div className="profile-stats">
                    <p>Nivel: {level}</p>
                    <p>PluCoin: {pluCoins}</p>
                  </div>
                  <NavLink
                    to="/change-password"
                    className="profile-link"
                    onClick={(e) => handleLinkInteraction(e, '/change-password')}
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
              to="/login"
              className="auth-button glowing"
              role="link"
              tabIndex={0}
              onClick={(e) => handleLinkInteraction(e, '/login')}
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
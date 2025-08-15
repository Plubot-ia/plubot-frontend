import { Home, Bot, Globe, Zap, Gem, Users, MessageCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

const NavLinks = ({ activeClassName = '', onLinkClick }) => {
  const links = [
    { to: '/', text: 'Inicio', icon: Home },
    {
      to: '/welcome',
      text: 'Crea tu Plubot',
      icon: Bot,
      className: 'tight-text',
    },
    { to: '/pluniverse', text: 'Pluniverse', icon: Globe },
    { to: '/poderes', text: 'Poderes', icon: Zap },
    { to: '/plans', text: 'Planes', icon: Gem },
    { to: '/coliseum', text: 'Comunidad', icon: Users },
    { to: '/contact', text: 'Contacto', icon: MessageCircle },
  ];

  return (
    <ul className={`nav-links ${activeClassName}`}>
      {links.map(({ to, text, icon: Icon, className }) => (
        <li key={to}>
          <NavLink to={to} end={to === '/'} className={className} onClick={onLinkClick}>
            <Icon size={18} className='nav-icon' /> {text}
          </NavLink>
        </li>
      ))}
    </ul>
  );
};

NavLinks.propTypes = {
  activeClassName: PropTypes.string,
  onLinkClick: PropTypes.func,
};

export default NavLinks;

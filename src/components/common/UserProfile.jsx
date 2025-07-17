import PropTypes from 'prop-types';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useGamification } from '../../hooks/useGamification';
import useAuthStore from '../../stores/use-auth-store';

const UserProfile = ({ onLinkClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { pluCoins, level } = useGamification();
  const navigate = useNavigate();

  const displayName =
    user?.name ?? localStorage.getItem('current_user_name') ?? 'Usuario';
  const displayEmail =
    localStorage.getItem('current_user_email') ?? user?.email ?? '';

  const handleProfileToggle = () => setIsProfileOpen(!isProfileOpen);

  const handleLogout = () => {
    // Navigate to home and close the menu.
    navigate('/', { replace: true });
    setIsProfileOpen(false);

    // Delay the logout call slightly to ensure navigation completes first.
    // This prevents a race condition with protected route guards.
    setTimeout(() => {
      logout();
    }, 50); // 50ms is a safe, imperceptible delay.
  };

  const handleLinkClick = () => {
    setIsProfileOpen(false);
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <div className='user-profile'>
      <button
        type='button'
        className='profile-icon'
        onClick={handleProfileToggle}
        aria-label='Abrir menú de perfil'
        aria-expanded={isProfileOpen}
      >
        <span>{user?.name?.charAt(0) || 'U'}</span>
      </button>
      {isProfileOpen && (
        <div className='profile-dropdown'>
          <div className='profile-info'>
            <p>{displayName}</p>
            <p className='profile-email'>{displayEmail}</p>
          </div>
          <div className='profile-stats'>
            <p>Nivel: {level}</p>
            <p>PluCoin: {pluCoins}</p>
          </div>
          <NavLink
            to='/change-password'
            className='profile-link'
            onClick={handleLinkClick}
          >
            Cambiar Contraseña
          </NavLink>
          <NavLink
            to='/profile'
            className='profile-link'
            onClick={handleLinkClick}
          >
            Ver Perfil
          </NavLink>
          <button onClick={handleLogout} className='logout-btn'>
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

UserProfile.propTypes = {
  onLinkClick: PropTypes.func,
};

export default UserProfile;

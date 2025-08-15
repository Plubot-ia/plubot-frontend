import PropTypes from 'prop-types';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useGamification } from '../../hooks/useGamification';
import useAuthStore from '../../stores/use-auth-store';

/**
 * Obtiene los nombres de usuario para mostrar.
 * @param {Object} user - Usuario del AuthStore.
 * @returns {Object} - Objeto con displayName y displayEmail.
 */
function getUserDisplayInfo(user) {
  const displayName = user?.name ?? localStorage.getItem('current_user_name') ?? 'Usuario';
  const displayEmail = localStorage.getItem('current_user_email') ?? user?.email ?? '';
  return { displayName, displayEmail };
}

/**
 * Maneja el proceso de logout con navegación segura.
 * @param {Function} navigate - Función de navegación de React Router.
 * @param {Function} setIsProfileOpen - Setter para cerrar el profile.
 * @param {Function} logout - Función de logout del AuthStore.
 */
function handleLogoutProcess(navigate, setIsProfileOpen, logout) {
  // Navigate to home and close the menu.
  navigate('/', { replace: true });
  setIsProfileOpen(false);

  // Delay the logout call slightly to ensure navigation completes first.
  // This prevents a race condition with protected route guards.
  setTimeout(() => {
    logout();
  }, 50); // 50ms is a safe, imperceptible delay.
}

/**
 * Maneja el click en links del profile dropdown.
 * @param {Function} setIsProfileOpen - Setter para cerrar el profile.
 * @param {Function} onLinkClick - Callback opcional del componente padre.
 */
function handleProfileLinkClick(setIsProfileOpen, onLinkClick) {
  setIsProfileOpen(false);
  if (onLinkClick) {
    onLinkClick();
  }
}

const UserProfile = ({ onLinkClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { pluCoins, level } = useGamification();
  const navigate = useNavigate();

  const { displayName, displayEmail } = getUserDisplayInfo(user);

  const handleProfileToggle = () => setIsProfileOpen(!isProfileOpen);

  const handleLogout = () => {
    handleLogoutProcess(navigate, setIsProfileOpen, logout);
  };

  const handleLinkClick = () => {
    handleProfileLinkClick(setIsProfileOpen, onLinkClick);
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
          <NavLink to='/change-password' className='profile-link' onClick={handleLinkClick}>
            Cambiar Contraseña
          </NavLink>
          <NavLink to='/profile' className='profile-link' onClick={handleLinkClick}>
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

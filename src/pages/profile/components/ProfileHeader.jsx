import PropTypes from 'prop-types';
import React from 'react';
import { FaSignOutAlt, FaUserEdit } from 'react-icons/fa';

import useProfileHeader from '../hooks/useProfileHeader';
import useProfileImageUpload from '../hooks/useProfileImageUpload';

import ProfileAvatar from './ProfileAvatar';

const ProfileHeader = ({
  user,
  updateProfile,
  level,
  showNotification,
  navigate,
  setRecentAchievement,
  setShowAchievementUnlocked,
}) => {
  const onEdit = () => navigate('/edit-profile');
  const onLogout = () => {
    // Aquí iría la lógica de logout, por ejemplo, desde un store.
    navigate('/login');
  };

  const { isMenuOpen, handleEdit, handleLogout } = useProfileHeader({
    onEdit,
    onLogout,
  });

  const { fileInputReference, imageLoaded, handleImageUpload, triggerFileInput, handleImageLoad } =
    useProfileImageUpload({
      user,
      updateProfile,
      showNotification,
      setRecentAchievement,
      setShowAchievementUnlocked,
      navigate,
    });

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      triggerFileInput();
    }
  };

  return (
    <div className='profile-header'>
      <ProfileAvatar
        user={user}
        level={level}
        imageLoaded={imageLoaded}
        fileInputReference={fileInputReference}
        triggerFileInput={triggerFileInput}
        handleKeyDown={handleKeyDown}
        handleImageLoad={handleImageLoad}
        handleImageUpload={handleImageUpload}
      />

      <h2 className='profile-card-title text-glow-intense'>{user.name || 'Usuario'}</h2>

      <div className='profile-status'>
        <div className='status-pill'>
          <div className='status-indicator' />
          ONLINE
        </div>
      </div>

      {isMenuOpen && (
        <div className='profile-menu-dropdown'>
          <button type='button' onClick={handleEdit} className='profile-menu-item'>
            <FaUserEdit /> Editar Perfil
          </button>
          <button type='button' onClick={handleLogout} className='profile-menu-item'>
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

ProfileHeader.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    profile_picture: PropTypes.string,
  }).isRequired,
  updateProfile: PropTypes.func.isRequired,
  level: PropTypes.string.isRequired,
  showNotification: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  setRecentAchievement: PropTypes.func.isRequired,
  setShowAchievementUnlocked: PropTypes.func.isRequired,
};

export default ProfileHeader;

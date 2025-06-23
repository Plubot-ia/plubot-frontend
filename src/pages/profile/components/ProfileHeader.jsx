import React, { useRef, useCallback, memo, useState } from 'react';
import axiosInstance from '@/utils/axiosConfig';

/**
 * Componente que muestra el encabezado del perfil del usuario
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.user - Datos del usuario
 * @param {Function} props.setUser - Función para actualizar los datos del usuario
 * @param {string} props.level - Nivel del usuario
 * @param {Function} props.showNotification - Función para mostrar notificaciones
 * @param {Function} props.navigate - Función de navegación
 * @param {Function} props.setRecentAchievement - Función para establecer el logro reciente
 * @param {Function} props.setShowAchievementUnlocked - Función para mostrar el popup de logro
 */
const ProfileHeader = memo(({ 
  user, 
  setUser, 
  level, 
  showNotification, 
  navigate, 
  setRecentAchievement, 
  setShowAchievementUnlocked 
}) => {
  const fileInputRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showNotification('Subiendo imagen...', 'info');

    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const response = await axiosInstance.put('/auth/profile', formData);
      const data = response.data;
      if (data.status === 'success' && data.user?.profile_picture) {
        setUser({ ...user, profile_picture: data.user.profile_picture });
        setImageLoaded(false); // Reset image loaded state for the new image
        showNotification('Imagen de perfil subida correctamente', 'success');
        setTimeout(() => {
          setRecentAchievement({
            title: '¡Identidad Digital!',
            description: 'Has personalizado tu perfil con una imagen única',
            icon: '📸',
          });
          setShowAchievementUnlocked(true);
        }, 1000);
      } else {
        showNotification(data.message || 'Error al subir la imagen', 'error');
      }
    } catch (error) {

      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        showNotification('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
        navigate('/login');
      } else {
        showNotification('Error al subir la imagen: ' + error.message, 'error');
      }
    }
  }, [user, setUser, showNotification, setRecentAchievement, setShowAchievementUnlocked, navigate]);

  const triggerFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  return (
    <div className="profile-header">
      <div className="profile-avatar-container">
        <div className="profile-avatar hover-effect profile-avatar-styles" onClick={triggerFileInput}>
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt="Profile"
              className={`profile-avatar-image profile-avatar-image-styles ${imageLoaded ? 'loaded' : ''}`}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="profile-avatar-inner">{user.name ? user.name.charAt(0) : ''}</div>
          )}
          <div className="profile-avatar-overlay">📷</div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/png,image/jpeg,image/gif"
          className="file-input-hidden"
        />
        <div className="profile-avatar-ring profile-avatar-ring-zindex"></div>
        <div className="profile-avatar-ring profile-avatar-ring-zindex"></div>
        <div className="profile-level-badge profile-level-badge-zindex">{level ? level.charAt(0) : ''}</div>
      </div>

      <h2 className="profile-card-title text-glow-intense">{user.name || 'Usuario'}</h2>

      <div className="profile-status">
        <div className="status-pill">
          <div className="status-indicator"></div>
          ONLINE
        </div>
      </div>
    </div>
  );
});

export default ProfileHeader;

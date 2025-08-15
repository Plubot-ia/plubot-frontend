import { useRef, useCallback, useState } from 'react';

import axiosInstance from '@/utils/axios-config.js';

const useProfileImageUpload = ({
  user,
  updateProfile,
  showNotification,
  setRecentAchievement,
  setShowAchievementUnlocked,
  navigate,
}) => {
  const fileInputReference = useRef();
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageUpload = useCallback(
    async (event) => {
      const [file] = event.target.files;
      if (!file) return;

      showNotification('Subiendo imagen...', 'info');

      const formData = new FormData();
      formData.append('profile_picture', file);

      try {
        const response = await axiosInstance.post('auth/profile', formData);
        const { data } = response;
        if (data.status === 'success' && data.user?.profile_picture) {
          updateProfile({
            ...user,
            profile_picture: data.user.profile_picture,
          });
          setImageLoaded(false);
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
          showNotification(`Error al subir la imagen: ${error.message}`, 'error');
        }
      }
    },
    [
      user,
      updateProfile,
      showNotification,
      setRecentAchievement,
      setShowAchievementUnlocked,
      navigate,
    ],
  );

  const triggerFileInput = useCallback(() => {
    if (fileInputReference.current) {
      fileInputReference.current.click();
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  return {
    fileInputReference,
    imageLoaded,
    handleImageUpload,
    triggerFileInput,
    handleImageLoad,
  };
};

export default useProfileImageUpload;

import { useState, useEffect, useRef, useContext } from 'react';
import axiosInstance from '@/utils/axiosConfig';
import { AuthContext } from '@/context/AuthContext';

/**
 * Hook personalizado para gestionar los datos del perfil del usuario
 * @returns {Object} - Objeto con estados y funciones para gestionar el perfil
 */
const useProfileData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [dailyRewardAvailable, setDailyRewardAvailable] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  
  // Identificadores únicos
  const profileId = useRef(
    (Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8)).toUpperCase()
  );
  const terminalId = useRef(
    (Math.random() + 1).toString(36).substring(2, 7).toUpperCase()
  );
  
  // Obtener contexto de autenticación
  const { user } = useContext(AuthContext);
  
  // Actualizar nivel de energía cuando cambia el usuario
  useEffect(() => {
    if (user && Array.isArray(user.plubots)) {
      const energy = Math.min(user.plubots.length * 20, 100);
      setEnergyLevel(energy);
    } else {
      setEnergyLevel(0);
    }
  }, [user]);

  /**
   * Función para cargar el perfil del usuario desde la API
   * @param {Function} setUser - Función para actualizar el usuario en el contexto
   * @param {Function} navigate - Función de navegación
   * @param {Function} setNotification - Función para mostrar notificaciones
   */
  const fetchUserProfile = async (setUser, navigate, setNotification) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setNotification({ message: 'Sesión no encontrada. Por favor, inicia sesión.', type: 'error' });
        navigate('/login');
        return;
      }
      
      const response = await axiosInstance.get('/api/auth/profile');
      
      if (response.data.status === 'success') {
        setUser(response.data.user);
      } else {
        setNotification({ message: response.data.message || 'Error al cargar el perfil', type: 'error' });
      }
    } catch (error) {
      console.error('[Profile] Error al refrescar perfil:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        setNotification({ message: 'Sesión expirada. Por favor, inicia sesión nuevamente.', type: 'error' });
        navigate('/login');
      } else {
        setNotification({ message: 'Error al cargar el perfil: ' + error.message, type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    setIsLoading,
    isLoaded,
    setIsLoaded,
    energyLevel,
    setEnergyLevel,
    dailyRewardAvailable,
    setDailyRewardAvailable,
    recentActivities,
    setRecentActivities,
    profileId,
    terminalId,
    fetchUserProfile
  };
};

export default useProfileData;

import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Contexts, Stores, and Services
import { useGamification } from '@/hooks/useGamification';
import useAuthStore from '@/stores/use-auth-store';

// Components
import ProfileAccessDenied from './components/ProfileAccessDenied';
import ProfileLoading from './components/ProfileLoading';
import ProfileView from './components/ProfileView';
// Custom Hooks
import useAchievements from './hooks/useAchievements';
import useMouseTracker from './hooks/useMouseTracker';
import useNotification from './hooks/useNotification';
import useProfileActions from './hooks/useProfileActions';
import useProfileEffects from './hooks/useProfileEffects';
import useProfileState from './hooks/useProfileState';

// Styles
import './styles/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, isLoadingProfile: isLoading } = useAuthStore();
  const { pluCoins, level, addPluCoins } = useGamification();

  // Estados locales que antes estaban en useProfileData
  const [isLoaded, setIsLoaded] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);

  // Refs para identificadores únicos que antes estaban en useProfileData
  const profileId = useRef(crypto.randomUUID());
  const terminalId = useRef(crypto.randomUUID().slice(0, 8).toUpperCase());

  // --- Data Derivation ---
  // Derivamos los datos directamente del estado `user` para asegurar la reactividad.
  // Usamos useMemo para optimizar y evitar recálculos innecesarios.
  const plubots = user?.plubots ?? [];

  const energyLevel = useMemo(() => Math.min(plubots.length * 20, 100), [plubots.length]);

  const profileData = {
    energyLevel,
    dailyRewardAvailable: true, // Placeholder, ajustar según la lógica real
    recentActivities, // Ahora viene del estado local
    isLoaded,
    profileId,
    terminalId,
  };
  const { notification, showNotification } = useNotification();
  const achievements = useAchievements();
  const { mousePosition, containerRef } = useMouseTracker();
  const profileState = useProfileState();

  // Hook de efectos
  useProfileEffects({
    setIsLoaded,
    setRecentAchievement: achievements.setRecentAchievement,
    setShowAchievementUnlocked: achievements.setShowAchievementUnlocked,
    setAnimateBadges: profileState.setAnimateBadges,
    dailyRewardAvailable: profileData.dailyRewardAvailable,
    setPulsatingElements: profileState.setPulsatingElements,
    setRecentActivities,
  });

  // Hook de acciones
  const { collectDailyReward, toggleSectionExpansion } = useProfileActions({
    addPluCoins,
    profileData,
    showNotification,
    profileState,
  });

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (!user) {
    return <ProfileAccessDenied />;
  }

  return (
    <ProfileView
      containerRef={containerRef}
      notification={notification}
      achievements={achievements}
      profileData={profileData} // profileData ahora se deriva directamente en Profile.jsx
      profileState={profileState}
      mousePosition={mousePosition}
      user={user}
      updateProfile={updateProfile}
      level={level}
      pluCoins={pluCoins}
      collectDailyReward={collectDailyReward}
      toggleSectionExpansion={toggleSectionExpansion}
      showNotification={showNotification}
      navigate={navigate}
      isLoading={isLoading}
    />
  );
};

export default Profile;

import PropTypes from 'prop-types';
import React, { memo, lazy, Suspense } from 'react';

import { useProfileMain } from '../hooks/useProfileMain';

import AchievementsSection from './AchievementsSection';
import ActivitiesSection from './ActivitiesSection';
import PowersSection from './PowersSection';
import ProfileHeader from './ProfileHeader';
import StatsSection from './StatsSection';
import SystemSection from './SystemSection';

const LazyVisualEffects = lazy(() => import('./VisualEffects'));

/**
 * Componente que muestra la sección principal del perfil del usuario
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.user - Datos del usuario
 * @param {Function} props.setUser - Función para actualizar los datos del usuario
 * @param {string} props.level - Nivel del usuario
 * @param {number} props.pluCoins - Monedas del usuario
 * @param {number} props.energyLevel - Nivel de energía del sistema
 * @param {boolean} props.dailyRewardAvailable - Indica si la recompensa diaria está disponible
 * @param {Array} props.pulsatingElements - Elementos que deben pulsar
 * @param {Function} props.collectDailyReward - Función para recolectar la recompensa diaria
 * @param {Array} props.recentActivities - Actividades recientes del usuario
 * @param {string|undefined} props.expandedSection - Sección actualmente expandida
 * @param {Function} props.toggleSectionExpansion - Alterna la expansión de una sección
 * @param {boolean} props.animateBadges - Indica si se deben animar las insignias
 * @param {Object} props.profileId - ID del perfil
 * @param {Function} props.showNotification - Función para mostrar notificaciones
 * @param {Function} props.navigate - Función de navegación
 * @param {Function} props.setRecentAchievement - Función para establecer el logro reciente
 * @param {Function} props.setShowAchievementUnlocked - Función para mostrar el popup de logro
 * @param {Function} props.setActiveTab - Función para cambiar la pestaña activa
 */
const ProfileMain = memo((props) => {
  const { user, setActiveTab, toggleSectionExpansion, expandedSection } = props;

  const {
    getPowerDetails,
    userStats,
    powerPercentage,
    handleViewPlubots,
    handleViewPowers,
    handleKeyDown,
  } = useProfileMain(user, setActiveTab, toggleSectionExpansion);

  const headerProps = {
    user,
    updateProfile: props.updateProfile,
    level: props.level,
    showNotification: props.showNotification,
    navigate: props.navigate,
    setRecentAchievement: props.setRecentAchievement,
    setShowAchievementUnlocked: props.setShowAchievementUnlocked,
  };

  const statsProps = {
    userStats,
    pluCoins: props.pluCoins,
    dailyRewardAvailable: props.dailyRewardAvailable,
    pulsatingElements: props.pulsatingElements,
    collectDailyReward: props.collectDailyReward,
    powerPercentage,
    handleViewPlubots,
    handleViewPowers,
  };

  const collapsibleSectionProps = {
    expandedSection,
    toggleSectionExpansion,
    animateBadges: props.animateBadges,
    handleKeyDown,
  };

  return (
    <div className='profile-main'>
      <ProfileHeader {...headerProps} />

      <div className='profile-grid'>
        <div className='profile-column'>
          <SystemSection profileId={props.profileId} energyLevel={props.energyLevel} />
          <StatsSection {...statsProps} />
        </div>

        <div className='profile-column'>
          <ActivitiesSection
            {...collapsibleSectionProps}
            recentActivities={props.recentActivities}
          />
          <AchievementsSection {...collapsibleSectionProps} user={user} />
          <PowersSection
            {...collapsibleSectionProps}
            user={user}
            getPowerDetails={getPowerDetails}
            handleViewPowers={handleViewPowers}
          />
        </div>
      </div>

      <Suspense fallback={false}>
        <LazyVisualEffects />
      </Suspense>
    </div>
  );
});

ProfileMain.displayName = 'ProfileMain';

ProfileMain.propTypes = {
  user: PropTypes.shape({
    plubots: PropTypes.arrayOf(PropTypes.object),
    powers: PropTypes.arrayOf(PropTypes.string),
    achievements: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        description: PropTypes.string,
        icon: PropTypes.string,
      }),
    ),
  }),
  updateProfile: PropTypes.func.isRequired,
  level: PropTypes.string.isRequired,
  pluCoins: PropTypes.number.isRequired,
  energyLevel: PropTypes.number.isRequired,
  dailyRewardAvailable: PropTypes.bool.isRequired,
  pulsatingElements: PropTypes.arrayOf(PropTypes.string).isRequired,
  collectDailyReward: PropTypes.func.isRequired,
  recentActivities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      text: PropTypes.string,
      time: PropTypes.string,
      timestamp: PropTypes.instanceOf(Date),
      icon: PropTypes.string,
    }),
  ).isRequired,
  expandedSection: PropTypes.string,
  toggleSectionExpansion: PropTypes.func.isRequired,
  animateBadges: PropTypes.bool.isRequired,
  profileId: PropTypes.shape({ current: PropTypes.any }).isRequired,
  showNotification: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  setRecentAchievement: PropTypes.func.isRequired,
  setShowAchievementUnlocked: PropTypes.func.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};

export default ProfileMain;

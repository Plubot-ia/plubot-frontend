import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import ProfileHeader from './ProfileHeader';
import { powers } from '@/data/powers';

// Lazy load para componentes pesados
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
 * @param {string|null} props.expandedSection - Sección actualmente expandida
 * @param {Function} props.toggleSectionExpansion - Función para alternar la expansión de una sección
 * @param {boolean} props.animateBadges - Indica si se deben animar las insignias
 * @param {Object} props.profileId - ID del perfil
 * @param {Function} props.showNotification - Función para mostrar notificaciones
 * @param {Function} props.navigate - Función de navegación
 * @param {Function} props.setRecentAchievement - Función para establecer el logro reciente
 * @param {Function} props.setShowAchievementUnlocked - Función para mostrar el popup de logro
 * @param {Function} props.setActiveTab - Función para cambiar la pestaña activa
 */
const ProfileMain = memo(({
  user,
  setUser,
  level,
  pluCoins,
  energyLevel,
  dailyRewardAvailable,
  pulsatingElements,
  collectDailyReward,
  recentActivities,
  expandedSection,
  toggleSectionExpansion,
  animateBadges,
  profileId,
  showNotification,
  navigate,
  setRecentAchievement,
  setShowAchievementUnlocked,
  setActiveTab
}) => {
  // Función para obtener detalles de un poder
  const getPowerDetails = useCallback((powerId) => {
    const power = powers.find((p) => p.id === powerId);
    return power ? { title: power.title, icon: power.icon, description: power.description } : { title: powerId, icon: '⚡', description: 'Desconocido' };
  }, [powers]);

  // Calcular estadísticas del usuario de manera memoizada
  const userStats = useMemo(() => {
    if (!user) return { totalPlubots: 0, totalPowers: 0, activePowers: 0 };
    
    const totalPlubots = user.plubots ? user.plubots.length : 0;
    const totalPowers = powers.length;
    const activePowers = user.powers ? user.powers.length : 0;
    
    return { totalPlubots, totalPowers, activePowers };
  }, [user]);
  
  // Calcular el porcentaje de poderes activos
  const powerPercentage = useMemo(() => {
    return userStats.totalPowers > 0 
      ? Math.round((userStats.activePowers / userStats.totalPowers) * 100) 
      : 0;
  }, [userStats.activePowers, userStats.totalPowers]);
  
  // Manejar la navegación a la sección de plubots
  const handleViewPlubots = useCallback(() => {
    setActiveTab('plubots');
  }, [setActiveTab]);
  
  // Manejar la navegación a la sección de poderes
  const handleViewPowers = useCallback(() => {
    setActiveTab('powers');
  }, [setActiveTab]);
  
  // Renderizar la sección de estadísticas
  const renderStatsSection = useMemo(() => (
    <div className="profile-stats">
      <div className="stat-card">
        <div className="stat-value">{userStats.totalPlubots}</div>
        <div className="stat-label">Plubots</div>
        <button 
          className="stat-action-button" 
          onClick={handleViewPlubots}
        >
          Ver todos
        </button>
      </div>
      
      <div className="stat-card">
        <div className="stat-value">{userStats.activePowers}</div>
        <div className="stat-label">Poderes</div>
        <div className="power-percentage">
          <div className="power-bar">
            <div 
              className="power-progress" 
              style={{ width: `${powerPercentage}%` }}
            ></div>
          </div>
          <div className="power-text">{powerPercentage}%</div>
        </div>
        <button 
          className="stat-action-button" 
          onClick={handleViewPowers}
        >
          Gestionar
        </button>
      </div>
      
      <div className="stat-card">
        <div className="stat-value">{pluCoins || 0}</div>
        <div className="stat-label">PluCoins</div>
        <div className={`daily-reward ${dailyRewardAvailable ? 'available' : ''} ${pulsatingElements.includes('daily-reward') ? 'pulsating' : ''}`}>
          <button 
            className="collect-reward-button" 
            onClick={collectDailyReward} 
            disabled={!dailyRewardAvailable}
          >
            {dailyRewardAvailable ? '🎁 Recompensa diaria' : '⏱️ Mañana'}
          </button>
        </div>
      </div>
    </div>
  ), [
    userStats, 
    pluCoins, 
    dailyRewardAvailable, 
    pulsatingElements, 
    collectDailyReward, 
    powerPercentage, 
    handleViewPlubots, 
    handleViewPowers
  ]);
  
  // Renderizar la sección de sistema
  const renderSystemSection = useMemo(() => (
    <div className="system-status">
      <div className="system-id">
        ID: {profileId.current}
      </div>
      <div className="energy-container">
        <div className="energy-label">Energía del sistema</div>
        <div className="energy-bar">
          <div 
            className="energy-level" 
            style={{ width: `${energyLevel}%` }}
          ></div>
        </div>
        <div className="energy-percentage">{energyLevel}%</div>
      </div>
    </div>
  ), [energyLevel, profileId]);
  
  // Renderizar la sección de actividades recientes - Optimizado con renderizado condicional
  const renderActivitiesSection = useCallback(() => (
    <div className={`collapsible-section ${expandedSection === 'activities' ? 'expanded' : ''}`}>
      <div 
        className="section-header" 
        onClick={() => toggleSectionExpansion('activities')}
      >
        <h3>Actividades Recientes</h3>
        <div className="section-toggle">
          {expandedSection === 'activities' ? '▼' : '▶'}
        </div>
      </div>
      
      {/* Renderizado condicional para mejorar rendimiento */}
      {expandedSection === 'activities' && (
        <div className="section-content activities-section">
          {recentActivities.map((activity, index) => (
            <div 
              key={`activity-${index}`} 
              className={`activity-item ${animateBadges ? 'animate-in' : ''}`} 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="activity-icon">{activity.icon}</div>
              <div className="activity-details">
                <div className="activity-text">{activity.text}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ), [expandedSection, toggleSectionExpansion, recentActivities, animateBadges]);
  
  // Renderizar la sección de logros - Optimizado con renderizado condicional
  const renderAchievementsSection = useMemo(() => (
    <div className={`collapsible-section ${expandedSection === 'achievements' ? 'expanded' : ''}`}>
      <div 
        className="section-header" 
        onClick={() => toggleSectionExpansion('achievements')}
      >
        <h3>Logros</h3>
        <div className="section-toggle">
          {expandedSection === 'achievements' ? '▼' : '▶'}
        </div>
      </div>
      
      {/* Renderizado condicional para mejorar rendimiento */}
      {expandedSection === 'achievements' && (
        <div className="section-content achievements-section">
          {user && user.achievements && user.achievements.map((achievement, index) => (
            <div 
              key={`achievement-${index}`} 
              className={`achievement-item ${animateBadges ? 'animate-in' : ''}`} 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="achievement-icon">{achievement.icon || '🏆'}</div>
              <div className="achievement-details">
                <div className="achievement-title">{achievement.title}</div>
                <div className="achievement-description">{achievement.description}</div>
              </div>
            </div>
          ))}
          
          {(!user || !user.achievements || user.achievements.length === 0) && (
            <div className="empty-state">
              <p>¡Completa desafíos para desbloquear logros!</p>
            </div>
          )}
        </div>
      )}
    </div>
  ), [expandedSection, toggleSectionExpansion, user, animateBadges]);
  
  // Renderizar la sección de poderes - Optimizado con renderizado condicional
  const renderPowersSection = useMemo(() => (
    <div className={`collapsible-section ${expandedSection === 'powers' ? 'expanded' : ''}`}>
      <div 
        className="section-header" 
        onClick={() => toggleSectionExpansion('powers')}
      >
        <h3>Poderes Activos</h3>
        <div className="section-toggle">
          {expandedSection === 'powers' ? '▼' : '▶'}
        </div>
      </div>
      
      {/* Renderizado condicional para mejorar rendimiento */}
      {expandedSection === 'powers' && (
        <div className="section-content powers-section">
          {user && user.powers && user.powers.map((powerId, index) => {
            const power = getPowerDetails(powerId);
            return (
              <div 
                key={`power-${index}`} 
                className={`power-item ${animateBadges ? 'animate-in' : ''}`} 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="power-icon">{power.icon}</div>
                <div className="power-details">
                  <div className="power-title">{power.title}</div>
                  <div className="power-description">{power.description}</div>
                </div>
              </div>
            );
          })}
          
          {(!user || !user.powers || user.powers.length === 0) && (
            <div className="empty-state">
              <p>Aún no has desbloqueado poderes</p>
              <button 
                className="cyber-button small" 
                onClick={handleViewPowers}
              >
                Explorar Poderes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  ), [expandedSection, toggleSectionExpansion, user, animateBadges, getPowerDetails, handleViewPowers]);
  
  return (
    <div className="profile-main">
      {/* Corregido: Pasando todas las props necesarias a ProfileHeader */}
      <ProfileHeader 
        user={user} 
        setUser={setUser} 
        level={level} 
        showNotification={showNotification}
        navigate={navigate}
        setRecentAchievement={setRecentAchievement}
        setShowAchievementUnlocked={setShowAchievementUnlocked}
      />
      
      <div className="profile-grid">
        <div className="profile-column">
          {renderSystemSection}
          {renderStatsSection}
        </div>
        
        <div className="profile-column">
          {renderActivitiesSection()}
          {renderAchievementsSection}
          {renderPowersSection}
        </div>
      </div>
      
      {/* Carga perezosa de efectos visuales */}
      <Suspense fallback={null}>
        <LazyVisualEffects />
      </Suspense>
    </div>
  );
});

export default ProfileMain;

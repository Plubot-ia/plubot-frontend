import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GamificationContext } from '@/context/GamificationContext';
import useAuthStore from '@/stores/useAuthStore';

// Componentes modularizados
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs from './components/ProfileTabs';
import ProfileMain from './components/ProfileMain';
import PlubotSection from './components/PlubotSection';
import PowersSection from './components/PowersSection';
import ActivitySection from './components/ActivitySection';
import NotificationSystem from './components/NotificationSystem';
import AchievementPopup from './components/AchievementPopup';
import VisualEffects from './components/VisualEffects';
import EditPlubotModal from './components/EditPlubotModal';
import PlubotDetailsModal from './components/PlubotDetailsModal';

// Hooks personalizados
import useProfileData from './hooks/useProfileData';
import useNotification from './hooks/useNotification';
import useAchievements from './hooks/useAchievements';
import useMouseTracker from './hooks/useMouseTracker';

// Estilos unificados
import './styles/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const { pluCoins, level, addPluCoins } = useContext(GamificationContext);
  
  // Estados centralizados usando hooks personalizados
  const { 
    isLoading, 
    isLoaded, 
    setIsLoaded,
    energyLevel, 
    dailyRewardAvailable, 
    setDailyRewardAvailable,
    recentActivities, 
    setRecentActivities,
    profileId,
    terminalId,
    fetchUserProfile
  } = useProfileData();
  
  const { 
    notification, 
    setNotification, 
    showNotification 
  } = useNotification();
  
  const { 
    showAchievementUnlocked, 
    recentAchievement, 
    setRecentAchievement, 
    setShowAchievementUnlocked 
  } = useAchievements();
  
  const { mousePosition, containerRef } = useMouseTracker();
  
  // Cargar el perfil al montar el componente - solo una vez
  useEffect(() => {
    // Evitar cargar el perfil si ya tenemos datos del usuario
    if (user) {
      return;
    }
    
    const loadProfile = async () => {
      try {
        // Usar el método fetchUserProfile del store de autenticación
        const { fetchUserProfile } = useAuthStore.getState();
        // No forzar la actualización si ya tenemos datos en caché
        const result = await fetchUserProfile(false);
        
        if (!result.success) {
          setNotification({ 
            message: result.message || 'Error al cargar el perfil. Por favor, inténtalo de nuevo más tarde.', 
            type: 'error' 
          });
          
          if (result.message?.includes('sesión')) {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Error al cargar el perfil:', error);
        setNotification({ 
          message: 'Error al cargar el perfil. Por favor, inténtalo de nuevo más tarde.', 
          type: 'error' 
        });
      }
    };
    
    loadProfile();
    // Incluir user en las dependencias para evitar cargar el perfil si ya existe
  }, [navigate, setNotification, user]);

  // Estados de UI
  const [activeTab, setActiveTab] = useState('profile');
  const [expandedSection, setExpandedSection] = useState(null);
  const [animateBadges, setAnimateBadges] = useState(false);
  const [pulsatingElements, setPulsatingElements] = useState([]);
  
  // Estados de modales
  const [modalPlubot, setModalPlubot] = useState(null);
  const [editModalPlubot, setEditModalPlubot] = useState(null);
  
  // Inicialización
  useEffect(() => {
    // La carga del perfil ya se maneja en el otro useEffect
    const loadingTimeout = setTimeout(() => setIsLoaded(true), 300);
    const achievementTimeout = setTimeout(() => {
      setRecentAchievement({
        title: '¡Explorador Digital!',
        description: 'Has explorado todas las secciones de tu perfil',
        icon: '🏆',
      });
      setShowAchievementUnlocked(true);
    }, 2000);
    const badgeAnimationTimeout = setTimeout(() => setAnimateBadges(true), 1500);

    return () => {
      clearTimeout(loadingTimeout);
      clearTimeout(achievementTimeout);
      clearTimeout(badgeAnimationTimeout);
    };
  }, []);

  // Manejar daily reward y energía
  useEffect(() => {
    if (dailyRewardAvailable) {
      setPulsatingElements((prev) => [...new Set([...prev, 'daily-reward'])]);
    }
  }, [dailyRewardAvailable]);

  // Generar actividades recientes
  useEffect(() => {
    const generateRecentActivities = () => {
      const now = new Date();
      return [
        { icon: '🏆', text: 'Completaste el desafío semanal', time: '2h', timestamp: new Date(now - 2 * 60 * 60 * 1000) },
        { icon: '⬆️', text: `Subiste al nivel ${level || 'N/A'}`, time: '1d', timestamp: new Date(now - 24 * 60 * 60 * 1000) },
        { icon: '💰', text: 'Ganaste 500 PluCoins', time: '2d', timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000) },
        { icon: '🤖', text: 'Creaste un nuevo Plubot', time: '3d', timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000) },
        { icon: '🔄', text: 'Completaste 5 conversaciones', time: '1w', timestamp: new Date(now - 7 * 24 * 60 * 60 * 1000) },
      ];
    };
    setRecentActivities(generateRecentActivities());
  }, [level]);

  // Ocultar logros
  useEffect(() => {
    if (showAchievementUnlocked) {
      const timer = setTimeout(() => setShowAchievementUnlocked(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAchievementUnlocked]);

  const collectDailyReward = () => {
    const reward = Math.floor(Math.random() * 200) + 100;
    addPluCoins(reward);
    setDailyRewardAvailable(false);
    showNotification(`¡Has recibido ${reward} PluCoins como recompensa diaria!`, 'success');
    
    const now = new Date();
    setRecentActivities([
      { icon: '🎁', text: `Reclamaste ${reward} PluCoins de recompensa diaria`, time: 'ahora', timestamp: now },
      ...recentActivities.slice(0, 4),
    ]);
    
    setTimeout(() => {
      setRecentAchievement({
        title: '¡Coleccionista Diario!',
        description: `Has reclamado tu recompensa diaria de ${reward} PluCoins`,
        icon: '🎁',
      });
      setShowAchievementUnlocked(true);
    }, 1000);
  };

  const toggleSectionExpansion = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleEditFlows = (plubotId) => {
    if (!plubotId) {
      console.error('[Profile] Error: plubotId no válido:', plubotId);
      showNotification('Error: ID del Plubot no válido', 'error');
      return;
    }
    console.log('[Profile] Navegando a editar flujos para plubotId:', plubotId);
    // Usar parámetro de ruta en lugar de parámetro de búsqueda para asegurar que el ID del Plubot se capture correctamente
    navigate(`/plubot/edit/training/${plubotId}`);
    setEditModalPlubot(null);
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading">Cargando perfil...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="login-prompt">
          <div className="login-prompt-icon">🔒</div>
          <h2 className="text-glow">Acceso Restringido</h2>
          <p>Se requiere autenticación para acceder a esta terminal.</p>
          <button className="cyber-button login-button" onClick={() => navigate('/login')}>
            INICIAR SESIÓN
          </button>
          <div className="terminal-lines">
            <div className="terminal-line">{'>'} Buscando credenciales...</div>
            <div className="terminal-line">{'>'} Error: Usuario no autenticado</div>
            <div className="terminal-line">{'>'} Por favor inicie sesión para continuar</div>
            <div className="terminal-line terminal-cursor">{'>'} _</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="profile-container">
      {/* Sistema de notificaciones */}
      <NotificationSystem notification={notification} />

      {/* Popup de logros */}
      <AchievementPopup 
        show={showAchievementUnlocked} 
        achievement={recentAchievement} 
      />

      {/* Efectos visuales */}
      <VisualEffects />

      <div className={`profile-card ${isLoaded ? 'profile-card-loaded' : ''}`}>
        {/* Tabs de navegación */}
        <ProfileTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        <div className="profile-content">
          {activeTab === 'profile' && (
            <ProfileMain 
              user={user}
              updateProfile={updateProfile}
              level={level}
              pluCoins={pluCoins}
              energyLevel={energyLevel}
              dailyRewardAvailable={dailyRewardAvailable}
              pulsatingElements={pulsatingElements}
              collectDailyReward={collectDailyReward}
              recentActivities={recentActivities}
              expandedSection={expandedSection}
              toggleSectionExpansion={toggleSectionExpansion}
              animateBadges={animateBadges}
              profileId={profileId}
              showNotification={showNotification}
              navigate={navigate}
              setRecentAchievement={setRecentAchievement}
              setShowAchievementUnlocked={setShowAchievementUnlocked}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'plubots' && (
            <PlubotSection 
              user={user}
              updateProfile={updateProfile}
              animateBadges={animateBadges}
              setModalPlubot={setModalPlubot}
              setEditModalPlubot={setEditModalPlubot}
              showNotification={showNotification}
              navigate={navigate}
            />
          )}

          {activeTab === 'powers' && (
            <PowersSection 
              user={user}
              updateProfile={updateProfile}
              showNotification={showNotification}
              navigate={navigate}
            />
          )}

          {activeTab === 'activity' && (
            <ActivitySection 
              recentActivities={recentActivities} 
              animateBadges={animateBadges} 
            />
          )}
        </div>

        <div className="terminal-footer">
          <div className="terminal-status">
            <div className="status-indicator"></div>
            Sistema: En línea
          </div>
          <div>Terminal ID: {terminalId.current}</div>
          <div>Última actualización: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Modales */}
      {modalPlubot && (
        <PlubotDetailsModal 
          plubot={modalPlubot} 
          setModalPlubot={setModalPlubot} 
          navigate={navigate} 
        />
      )}

      {editModalPlubot && (
        <EditPlubotModal 
          plubot={editModalPlubot} 
          setEditModalPlubot={setEditModalPlubot} 
          handleEditFlows={handleEditFlows}
          showNotification={showNotification}
          navigate={navigate}
        />
      )}

      <div className="mouse-glow" style={{ left: mousePosition.x - 128, top: mousePosition.y - 128 }}></div>
    </div>
  );
};

export default Profile;
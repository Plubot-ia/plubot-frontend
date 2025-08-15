import PropTypes from 'prop-types';
import React from 'react';

import AchievementPopup from './AchievementPopup';
import EditPlubotModal from './EditPlubotModal';
import NotificationSystem from './NotificationSystem';
import PlubotDetailsModal from './PlubotDetailsModal';
import ProfileContent from './ProfileContent';
import ProfileTabs from './ProfileTabs';
import VisualEffects from './VisualEffects';

const ProfileView = ({
  containerRef,
  notification,
  achievements,
  profileData,
  profileState,
  mousePosition,
  isLoading,
  ...props
}) => (
  <div ref={containerRef} className='profile-container'>
    <NotificationSystem notification={notification} />
    <AchievementPopup
      show={achievements.showAchievementUnlocked}
      achievement={achievements.recentAchievement}
    />
    <VisualEffects />

    <div className={`profile-card ${profileData.isLoaded ? 'profile-card-loaded' : ''}`}>
      <ProfileTabs activeTab={profileState.activeTab} setActiveTab={profileState.setActiveTab} />

      <div className='profile-content'>
        <ProfileContent
          {...props}
          {...profileState}
          {...profileData}
          {...achievements}
          level={props.level.toString()}
          profileId={profileData.profileId}
          isLoading={isLoading}
        />
      </div>

      <div className='terminal-footer'>
        <div className='terminal-status'>
          <div className='status-indicator' />
          Sistema: En línea
        </div>
        <div>Terminal ID: {profileData.terminalId.current}</div>
        <div>Última actualización: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>

    {profileState.modalPlubot && (
      <PlubotDetailsModal
        plubot={profileState.modalPlubot}
        setModalPlubot={profileState.setModalPlubot}
        navigate={props.navigate}
      />
    )}

    {profileState.editModalPlubot && (
      <EditPlubotModal
        plubot={profileState.editModalPlubot}
        setEditModalPlubot={profileState.setEditModalPlubot}
        showNotification={props.showNotification}
        navigate={props.navigate}
      />
    )}

    <div
      className='mouse-glow'
      style={{
        left: mousePosition.x - 128,
        top: mousePosition.y - 128,
        pointerEvents: 'none',
      }}
    />
  </div>
);

ProfileView.propTypes = {
  containerRef: PropTypes.object.isRequired,
  notification: PropTypes.object,
  achievements: PropTypes.object.isRequired,
  profileData: PropTypes.object.isRequired,
  profileState: PropTypes.object.isRequired,
  mousePosition: PropTypes.object.isRequired,
  navigate: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  level: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isLoading: PropTypes.bool,
};

export default ProfileView;

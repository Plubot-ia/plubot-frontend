import PropTypes from 'prop-types';
import React from 'react';

import ActivitySection from './ActivitySection';
import BackupSection from './BackupSection';
import IntegrationsSection from './IntegrationsSection';
import PlubotSection from './PlubotSection';
import PowersTab from './PowersTab';
import ProfileMain from './ProfileMain';

const ProfileContent = (props) => {
  const { activeTab } = props;

  if (activeTab === 'profile') return <ProfileMain {...props} />;
  if (activeTab === 'plubots') {
    return <PlubotSection {...props} isLoading={props.isLoading} />;
  }
  if (activeTab === 'powers') return <PowersTab {...props} />;
  if (activeTab === 'activity') return <ActivitySection {...props} />;
  if (activeTab === 'backup') return <BackupSection {...props} />;
  if (activeTab === 'integrations') return <IntegrationsSection {...props} />;
};

ProfileContent.propTypes = {
  activeTab: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  updateProfile: PropTypes.func.isRequired,
  level: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  pluCoins: PropTypes.number.isRequired,
  energyLevel: PropTypes.number.isRequired,
  dailyRewardAvailable: PropTypes.bool.isRequired,
  pulsatingElements: PropTypes.array.isRequired,
  collectDailyReward: PropTypes.func.isRequired,
  recentActivities: PropTypes.array.isRequired,
  expandedSection: PropTypes.string,
  toggleSectionExpansion: PropTypes.func.isRequired,
  animateBadges: PropTypes.bool.isRequired,
  profileId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  showNotification: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  setRecentAchievement: PropTypes.func.isRequired,
  setShowAchievementUnlocked: PropTypes.func.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  setModalPlubot: PropTypes.func.isRequired,
  setEditModalPlubot: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default ProfileContent;

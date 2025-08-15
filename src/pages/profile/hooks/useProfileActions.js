const useProfileActions = ({ addPluCoins, profileData, showNotification, profileState }) => {
  const collectDailyReward = () => {
    addPluCoins(100);
    profileData.setDailyRewardAvailable(false);
    showNotification('¡+100 PluCoins! Recompensa diaria reclamada.', 'success');
    profileState.setPulsatingElements((previous) =>
      previous.filter((item) => item !== 'daily-reward'),
    );
    profileData.setRecentActivities((previous) => [
      {
        id: Date.now(),
        text: 'Reclamaste tu recompensa diaria de 100 PluCoins',
        time: 'ahora mismo',
        icon: '🎉',
      },
      ...previous,
    ]);
  };

  const toggleSectionExpansion = (section) => {
    profileState.setExpandedSection(profileState.expandedSection === section ? undefined : section);
  };

  return { collectDailyReward, toggleSectionExpansion };
};

export default useProfileActions;

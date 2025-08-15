import React from 'react';

import CopyIdStep from './components/CopyIdStep';
import DeveloperModeStep from './components/DeveloperModeStep';
import DiscordTutorialFooter from './components/DiscordTutorialFooter';
import DiscordTutorialHeader from './components/DiscordTutorialHeader';
import WhyIdStep from './components/WhyIdStep';
import './TutorialDiscordChannelId.css';

const TutorialDiscordChannelId = () => (
  <div className='tutorial-discord-container'>
    <DiscordTutorialHeader />
    <DeveloperModeStep />
    <CopyIdStep />
    <WhyIdStep />
    <DiscordTutorialFooter />
  </div>
);

export default TutorialDiscordChannelId;

import { useState, useRef } from 'react';

import { tabs, rankings, plubots, challenges } from './coliseum-data';
import BattleCard from './components/BattleCard';
import ChallengeCard from './components/ChallengeCard';
import ColiseumHeader from './components/ColiseumHeader';
import RankingTable from './components/RankingTable';
import StatCards from './components/StatCards';
import Tabs from './components/Tabs';
import useParticleAnimation from './hooks/useParticleAnimation';

import './Coliseum.css';

export default function Coliseum() {
  const [activeTab, setActiveTab] = useState('ranking');
  const canvasReference = useRef(undefined);

  useParticleAnimation(canvasReference);

  const renderContent = () => {
    switch (activeTab) {
      case 'ranking': {
        return <RankingTable rankings={rankings} />;
      }
      case 'plubots': {
        return (
          <div className='battle-card-grid'>
            {plubots.map((plubot) => (
              <BattleCard key={plubot.id} plubot={plubot} />
            ))}
          </div>
        );
      }
      case 'challenges': {
        return (
          <div>
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        );
      }
      default:
    }
  };

  return (
    <div className='coliseo-container'>
      <canvas ref={canvasReference} className='particle-canvas' />
      <div className='coliseo-content'>
        <ColiseumHeader />
        <StatCards />
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className='tab-content'>{renderContent()}</div>
      </div>
    </div>
  );
}

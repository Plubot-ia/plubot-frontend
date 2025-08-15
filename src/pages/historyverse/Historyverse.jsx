// Importaciones de imágenes

import React, { useRef } from 'react';

import useWindowSize from '../../hooks/useWindowSize';

import CharacterSection from './components/CharacterSection';
import CtaSection from './components/CtaSection';
import GameUI from './components/GameUI';
import GamificationSection from './components/GamificationSection';
import HistoryverseHero from './components/HistoryverseHero';
import MapSection from './components/MapSection';
import OriginSection from './components/OriginSection';
import { useHistoryverse } from './useHistoryverse';
import { useHistoryverseEffects } from './useHistoryverseEffects';

import './Historyverse.css';

const Historyverse = () => {
  const {
    userLevel,
    pluCoins,
    showBadgeNotification,
    selectedZone,
    characterHover,
    characters,
    zones,
    badges,
    unlockedPercentage,
    handleCardClick,
    visitZone,
    earnCoins,
    levelUp,
    setCharacterHover,
  } = useHistoryverse();
  const { width, height } = useWindowSize();
  const heroReference = useRef(undefined);
  const starsCanvasReference = useRef(undefined);

  useHistoryverseEffects({
    heroRef: heroReference,
    starsCanvasRef: starsCanvasReference,
    width,
    height,
  });

  return (
    <div className='historyverse-wrapper'>
      <canvas ref={starsCanvasReference} className='stars-canvas' />

      <GameUI
        userLevel={userLevel}
        pluCoins={pluCoins}
        showBadgeNotification={showBadgeNotification}
      />

      <HistoryverseHero ref={heroReference} />

      <OriginSection onEarnCoins={earnCoins} />

      <CharacterSection
        characters={characters}
        unlockedPercentage={unlockedPercentage}
        characterHover={characterHover}
        onCharacterHover={setCharacterHover}
        onCardClick={handleCardClick}
      />

      <MapSection zones={zones} selectedZone={selectedZone} onVisitZone={visitZone} />

      <GamificationSection
        userLevel={userLevel}
        pluCoins={pluCoins}
        badges={badges}
        onLevelUp={levelUp}
      />

      <CtaSection />
    </div>
  );
};

export default Historyverse;

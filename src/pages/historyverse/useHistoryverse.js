import { useState, useEffect, useCallback } from 'react';

import { initialCharacters, initialZones, initialBadges } from './historyverse-data';

// Hook auxiliar para la lógica de desbloqueo de logros
const useBadgeUnlocks = ({ userLevel, badges, setBadges, setShowBadgeNotification }) => {
  useEffect(() => {
    const hadUnlocked = badges.some((b) => b.unlocked);
    const newBadges = badges.map((badge) =>
      userLevel >= badge.unlockLevel ? { ...badge, unlocked: true } : badge,
    );
    const hasNewUnlock = newBadges.some((b) => b.unlocked);

    if (hasNewUnlock && !hadUnlocked) {
      setShowBadgeNotification(true);
      setTimeout(() => setShowBadgeNotification(false), 3000);
    }

    setBadges(newBadges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLevel]);
};

export const useHistoryverse = () => {
  // --- ESTADO ---
  const [userLevel, setUserLevel] = useState(1);
  const [pluCoins, setPluCoins] = useState(50);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);
  const [selectedZone, setSelectedZone] = useState();
  const [characterHover, setCharacterHover] = useState();
  const [characters, setCharacters] = useState(initialCharacters);
  const [zones] = useState(initialZones);
  const [badges, setBadges] = useState(initialBadges);

  // --- MANEJADORES Y LÓGICA ---
  const earnCoins = useCallback((amount) => {
    setPluCoins((previousCoins) => previousCoins + amount);
  }, []);

  const levelUp = useCallback(() => {
    const cost = userLevel * 100;
    if (pluCoins >= cost) {
      setPluCoins((previousCoins) => previousCoins - cost);
      setUserLevel((previousLevel) => previousLevel + 1);
    }
  }, [userLevel, pluCoins]);

  const handleCardClick = useCallback(
    (character) => {
      if (!character.locked) {
        earnCoins(5);
      }
    },
    [earnCoins],
  );

  const visitZone = useCallback(
    (zoneId) => {
      setSelectedZone(zoneId);
      earnCoins(10);
    },
    [earnCoins],
  );

  // --- EFECTOS SECUNDARIOS ---
  useEffect(() => {
    setCharacters((previous) =>
      previous.map((char) => (userLevel >= char.unlockLevel ? { ...char, locked: false } : char)),
    );
  }, [userLevel]);

  useBadgeUnlocks({ userLevel, badges, setBadges, setShowBadgeNotification });

  // --- ESTADO DERIVADO ---
  const unlockedPercentage = (characters.filter((c) => !c.locked).length / characters.length) * 100;

  return {
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
  };
};

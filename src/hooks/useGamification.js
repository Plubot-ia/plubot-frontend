import { useContext } from 'react';

import { GamificationContext } from '../context/GamificationContextObject';

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification debe usarse dentro de un GamificationProvider');
  }
  return context;
};

import { createContext, useState, useEffect, useContext } from 'react';

export const GamificationContext = createContext();

export const GamificationProvider = ({ children }) => {
  const [level, setLevel] = useState('Constructor Novato');
  const [achievements, setAchievements] = useState([]);
  const [xp, setXp] = useState(0);
  const [pluCoins, setPluCoins] = useState(0);

  const addXp = (points) => {
    setXp((prev) => prev + points);
    if (xp + points >= 100) {
      setLevel('Arquitecto de Flujos');
      setAchievements((prev) => [...prev, 'Primer Nivel Alcanzado']);
    }
  };

  const addPluCoins = (coins) => {
    setPluCoins((prev) => prev + coins);
  };

  return (
    <GamificationContext.Provider value={{ level, achievements, xp, addXp, pluCoins, addPluCoins }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification debe usarse dentro de un GamificationProvider');
  }
  return context;
};
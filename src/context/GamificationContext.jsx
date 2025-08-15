import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { GamificationContext } from './GamificationContextObject';

const GamificationProvider = ({ children }) => {
  const [level, setLevel] = useState('Constructor Novato');
  const [achievements, setAchievements] = useState([]);
  const [xp, setXp] = useState(0);
  const [pluCoins, setPluCoins] = useState(0);

  const addXp = (points) => {
    setXp((previous) => previous + points);
    if (xp + points >= 100) {
      setLevel('Arquitecto de Flujos');
      setAchievements((previous) => [...previous, 'Primer Nivel Alcanzado']);
    }
  };

  const addPluCoins = (coins) => {
    setPluCoins((previous) => previous + coins);
  };

  return (
    <GamificationContext.Provider value={{ level, achievements, xp, addXp, pluCoins, addPluCoins }}>
      {children}
    </GamificationContext.Provider>
  );
};

GamificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default GamificationProvider;

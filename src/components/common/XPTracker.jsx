import React from 'react';
import './XPTracker.css';

const XPTracker = ({ xpGained, level }) => {
  const totalXP = parseInt(localStorage.getItem('plubot_xp_total') || '0');

  return (
    <div className="xp-tracker">
      <p>Nivel: {level}</p>
      <p>XP Total: {totalXP}</p>
      <p>XP en este artículo: {xpGained}</p>
    </div>
  );
};

export default XPTracker;
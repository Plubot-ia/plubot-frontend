import React from 'react';

/**
 * Componente para mostrar un popup de logro desbloqueado
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.show - Indica si se debe mostrar el popup
 * @param {Object} props.achievement - Datos del logro (título, descripción, icono)
 */
const AchievementPopup = ({ show, achievement }) => {
  if (!show || !achievement) return null;

  return (
    <div className="achievement-unlocked">
      <div className="achievement-icon">{achievement.icon}</div>
      <div className="achievement-content">
        <h3>¡Logro Desbloqueado!</h3>
        <h4>{achievement.title}</h4>
        <p>{achievement.description}</p>
      </div>
    </div>
  );
};

export default AchievementPopup;

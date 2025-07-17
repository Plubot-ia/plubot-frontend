import PropTypes from 'prop-types';

/**
 * Componente para mostrar un popup de logro desbloqueado
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.show - Indica si se debe mostrar el popup
 * @param {Object} props.achievement - Datos del logro (título, descripción, icono)
 */
function AchievementPopup({ show, achievement }) {
  // eslint-disable-next-line unicorn/no-null
  if (!show || !achievement) return null;

  return (
    <div className='achievement-unlocked'>
      <div className='achievement-icon'>{achievement.icon}</div>
      <div className='achievement-content'>
        <h3>¡Logro Desbloqueado!</h3>
        <h4>{achievement.title}</h4>
        <p>{achievement.description}</p>
      </div>
    </div>
  );
}

AchievementPopup.propTypes = {
  show: PropTypes.bool.isRequired,
  achievement: PropTypes.shape({
    icon: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }),
};

export default AchievementPopup;

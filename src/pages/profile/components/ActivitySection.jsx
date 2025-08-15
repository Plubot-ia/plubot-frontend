import PropTypes from 'prop-types';
/**
 * Componente que muestra la sección de actividades recientes del usuario
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.recentActivities - Lista de actividades recientes
 * @param {boolean} props.animateBadges - Indica si se deben animar los elementos
 */
function ActivitySection({ recentActivities, animateBadges = false }) {
  return (
    <div className='profile-section activity-section'>
      <h3 className='profile-section-title'>ACTIVIDAD RECIENTE</h3>
      <ul className='activity-list expanded'>
        {recentActivities.map((activity, index) => (
          <li
            key={`${activity.text}-${activity.time}`}
            className={`activity-item animated ${animateBadges ? 'animate-in' : ''}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className='activity-icon'>{activity.icon}</div>
            <div className='activity-content'>
              <p className='activity-text'>{activity.text}</p>
              <p className='activity-time'>{activity.time} atrás</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

ActivitySection.propTypes = {
  recentActivities: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
    }),
  ).isRequired,
  animateBadges: PropTypes.bool,
};

export default ActivitySection;

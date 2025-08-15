import PropTypes from 'prop-types';

/**
 * Componente que muestra notificaciones al usuario
 * @param {Object} props - Propiedades del componente
 * @param {Object|null} props.notification - Objeto de notificación con mensaje y tipo
 */
const NotificationSystem = ({ notification }) => {
  // En React, devolver null es una práctica idiomática para no renderizar nada.
  // Se deshabilita esta regla de unicorn específicamente para este caso.
  // eslint-disable-next-line unicorn/no-null
  if (!notification) return null;

  return (
    <div className={`notification notification-${notification.type} notification-position`}>
      {typeof notification.message === 'string'
        ? notification.message
        : 'Notification message is not a string.'}
    </div>
  );
};

NotificationSystem.propTypes = {
  notification: PropTypes.shape({
    type: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
  }),
};

export default NotificationSystem;

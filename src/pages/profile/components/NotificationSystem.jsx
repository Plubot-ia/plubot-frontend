import React from 'react';

/**
 * Componente que muestra notificaciones al usuario
 * @param {Object} props - Propiedades del componente
 * @param {Object|null} props.notification - Objeto de notificación con mensaje y tipo
 */
const NotificationSystem = ({ notification }) => {
  if (!notification) return null;
  
  return (
    <div className={`notification notification-${notification.type} notification-position`}>
      {typeof notification.message === 'string' ? notification.message : 'Notification message is not a string.'}
    </div>
  );
};

export default NotificationSystem;

/**
 * notification-manager.js
 * Sistema de notificaciones global para la aplicación
 * Proporciona una forma centralizada de mostrar mensajes al usuario
 */

// Almacena los callbacks registrados para notificaciones
let notificationCallbacks = [];

/**
 * Registra una función callback para recibir notificaciones
 * @param {Function} callback - Función que recibe (message, type)
 * @returns {Function} Función para cancelar el registro
 */
export const registerNotificationCallback = (callback) => {
  if (typeof callback !== 'function') {
    // eslint-disable-next-line no-empty-function
    return () => {}; // No-op: función vacía para callbacks inválidos.
  }

  notificationCallbacks.push(callback);

  // Devolver función para cancelar registro
  return () => {
    notificationCallbacks = notificationCallbacks.filter((callback_) => callback_ !== callback);
  };
};

/**
 * Envía una notificación a todos los callbacks registrados
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación ('success', 'error', 'warning', 'info')
 */
/**
 * Muestra una notificación visual como fallback
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación
 */
export const showVisualNotification = (message, type = 'info') => {
  try {
    // Evitar crear múltiples notificaciones para el mismo mensaje
    const existingNotification = document.querySelector(`.notification-${type}`);
    if (existingNotification && existingNotification.textContent === message) {
      return;
    }

    const notification = document.createElement('div');
    notification.className = `notification-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 15px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '9999';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.fontFamily = 'Arial, sans-serif';
    notification.style.fontSize = '14px';

    // Establecer colores según el tipo
    switch (type) {
      case 'success': {
        notification.style.backgroundColor = '#4caf50';
        notification.style.color = 'white';
        break;
      }
      case 'error': {
        notification.style.backgroundColor = '#f44336';
        notification.style.color = 'white';
        break;
      }
      case 'warning': {
        notification.style.backgroundColor = '#ff9800';
        notification.style.color = 'white';
        break;
      }
      default: {
        notification.style.backgroundColor = '#2196f3';
        notification.style.color = 'white';
        break;
      }
    }

    // Botón para cerrar la notificación
    const closeButton = document.createElement('span');
    closeButton.textContent = '×';
    closeButton.style.marginLeft = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.fontSize = '16px';
    closeButton.addEventListener('click', () => {
      if (notification.parentNode) {
        notification.remove();
      }
    });

    notification.append(closeButton);
    document.body.append(notification);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  } catch {}
};

/**
 * Envía una notificación a todos los callbacks registrados
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación ('success', 'error', 'warning', 'info')
 */
export const sendNotification = (message, type = 'info') => {
  // Disparar evento global para cualquier componente que escuche
  try {
    globalThis.dispatchEvent(
      new CustomEvent('plubot-notification', {
        detail: { message, type, timestamp: Date.now() },
      }),
    );
  } catch {}

  // Notificar a todos los callbacks registrados
  for (const callback of notificationCallbacks) {
    try {
      callback(message, type);
    } catch {}
  }

  // Fallback para mostrar notificaciones si no hay callbacks
  if (notificationCallbacks.length === 0) {
    showVisualNotification(message, type);
  }
};

// Exponer setByteMessage como una interfaz compatible para código existente
export const setByteMessage = (message, type = 'info') => {
  sendNotification(message, type);
};

// Global assignments removed as part of refactoring to context-based notifications.

const notificationManager = {
  registerNotificationCallback,
  sendNotification,
  showVisualNotification,
  setByteMessage,
};

export default notificationManager;

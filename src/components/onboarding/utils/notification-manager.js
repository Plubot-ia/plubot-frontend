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
    console.warn('[NotificationManager] Intento de registrar un callback que no es una función');
    return () => {}; // Devolver una función vacía
  }
  
  notificationCallbacks.push(callback);
  console.log(`[NotificationManager] Callback registrado. Total: ${notificationCallbacks.length}`);
  
  // Devolver función para cancelar registro
  return () => {
    notificationCallbacks = notificationCallbacks.filter(cb => cb !== callback);
    console.log(`[NotificationManager] Callback eliminado. Quedan: ${notificationCallbacks.length}`);
  };
};

/**
 * Envía una notificación a todos los callbacks registrados
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación ('success', 'error', 'warning', 'info')
 */
export const sendNotification = (message, type = 'info') => {
  console.log(`[NotificationManager] Enviando notificación: ${message} (${type})`);
  
  // Disparar evento global para cualquier componente que escuche
  try {
    window.dispatchEvent(new CustomEvent('plubot-notification', {
      detail: { message, type, timestamp: Date.now() }
    }));
  } catch (e) {
    console.error('[NotificationManager] Error al disparar evento global:', e);
  }
  
  // Notificar a todos los callbacks registrados
  notificationCallbacks.forEach(callback => {
    try {
      callback(message, type);
    } catch (error) {
      console.error('[NotificationManager] Error en callback de notificación:', error);
    }
  });
  
  // Fallback para mostrar notificaciones si no hay callbacks
  if (notificationCallbacks.length === 0) {
    showVisualNotification(message, type);
  }
};

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
      case 'success':
        notification.style.backgroundColor = '#4caf50';
        notification.style.color = 'white';
        break;
      case 'error':
        notification.style.backgroundColor = '#f44336';
        notification.style.color = 'white';
        break;
      case 'warning':
        notification.style.backgroundColor = '#ff9800';
        notification.style.color = 'white';
        break;
      case 'info':
      default:
        notification.style.backgroundColor = '#2196f3';
        notification.style.color = 'white';
        break;
    }
    
    // Botón para cerrar la notificación
    const closeButton = document.createElement('span');
    closeButton.textContent = '×';
    closeButton.style.marginLeft = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.fontSize = '16px';
    closeButton.onclick = () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    };
    
    notification.appendChild(closeButton);
    document.body.appendChild(notification);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  } catch (error) {
    console.error('[NotificationManager] Error al mostrar notificación visual:', error);
  }
};

// Exponer setByteMessage como una interfaz compatible para código existente
export const setByteMessage = (message, type = 'info') => {
  sendNotification(message, type);
};

// Inicialización: Hacer que setByteMessage esté disponible globalmente
if (typeof window !== 'undefined') {
  window.setByteMessage = setByteMessage;
  window.sendNotification = sendNotification;
}

export default {
  registerNotificationCallback,
  sendNotification,
  showVisualNotification,
  setByteMessage
};

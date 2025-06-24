/**
 * init-systems.js
 * Inicializa los diferentes sistemas utilitarios de la aplicación
 */

import { initModalManager } from './modal-manager';
import { registerNotificationCallback, showVisualNotification } from './notification-manager';

/**
 * Inicializa todos los sistemas utilitarios
 */
export const initAllSystems = () => {


  // Inicializar sistema de modales
  initModalManager();

  // Configurar captura de errores globales para setByteMessage
  setupErrorHandling();


};

/**
 * Configura el manejo de errores para funciones críticas
 */
const setupErrorHandling = () => {
  // Capturar errores de setByteMessage a nivel global
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('setByteMessage is not a function')) {
      // Mostrar notificación visual como fallback
      const errorMessage = event.error?.message || 'Error en la operación';
      showVisualNotification(errorMessage, 'error');

      // window.setByteMessage redefinition removed.
      // Evitar que el error se propague
      event.preventDefault();
      return true;
    }
  });

  // Escuchar eventos globales de notificación como respaldo
  window.addEventListener('plubot-notification', (event) => {
    const { message, type } = event.detail;
    showVisualNotification(message, type);
  });
};

// Auto-inicializar los sistemas cuando se importa este módulo
initAllSystems();

export default {
  initAllSystems,
};

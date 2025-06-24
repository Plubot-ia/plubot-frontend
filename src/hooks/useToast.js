import { useState, useCallback } from 'react';


/**
 * Hook personalizado para mostrar notificaciones toast
 * @returns {Object} Métodos para mostrar y ocultar toasts
 */
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  // Crear contenedor para los toasts si no existe
  const getToastContainer = useCallback(() => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.top = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '10px';
      document.body.appendChild(container);
    }
    return container;
  }, []);

  // Mostrar un toast
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now().toString();
    const toast = { id, message, type, duration };

    // Crear elemento para el toast
    const toastElement = document.createElement('div');
    toastElement.id = `toast-${id}`;
    toastElement.style.padding = '12px 16px';
    toastElement.style.borderRadius = '8px';
    toastElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    toastElement.style.minWidth = '250px';
    toastElement.style.maxWidth = '350px';
    toastElement.style.animation = 'toast-in 0.3s ease forwards';
    toastElement.style.display = 'flex';
    toastElement.style.justifyContent = 'space-between';
    toastElement.style.alignItems = 'center';

    // Aplicar estilos según el tipo
    switch (type) {
      case 'success':
        toastElement.style.backgroundColor = '#4caf50';
        toastElement.style.color = 'white';
        break;
      case 'error':
        toastElement.style.backgroundColor = '#f44336';
        toastElement.style.color = 'white';
        break;
      case 'warning':
        toastElement.style.backgroundColor = '#ff9800';
        toastElement.style.color = 'white';
        break;
      default:
        toastElement.style.backgroundColor = '#4facfe';
        toastElement.style.color = 'white';
    }

    // Crear contenido del toast
    const messageElement = document.createElement('span');
    messageElement.textContent = message;

    // Crear botón de cierre
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'inherit';
    closeButton.style.fontSize = '18px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.marginLeft = '8px';
    closeButton.style.opacity = '0.8';
    closeButton.style.transition = 'opacity 0.2s';
    closeButton.onmouseover = () => { closeButton.style.opacity = '1'; };
    closeButton.onmouseout = () => { closeButton.style.opacity = '0.8'; };

    // Función para cerrar el toast
    const closeToast = () => {
      toastElement.style.animation = 'toast-out 0.3s ease forwards';
      setTimeout(() => {
        const container = getToastContainer();
        if (container.contains(toastElement)) {
          container.removeChild(toastElement);
        }
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    };

    // Agregar evento al botón de cierre
    closeButton.onclick = closeToast;

    // Agregar elementos al toast
    toastElement.appendChild(messageElement);
    toastElement.appendChild(closeButton);

    // Agregar toast al contenedor
    const container = getToastContainer();
    container.appendChild(toastElement);

    // Agregar estilos de animación si no existen
    if (!document.getElementById('toast-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'toast-styles';
      styleElement.textContent = `
        @keyframes toast-in {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes toast-out {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-20px); opacity: 0; }
        }
      `;
      document.head.appendChild(styleElement);
    }

    // Configurar cierre automático
    setTimeout(closeToast, duration);

    // Actualizar estado
    setToasts(prev => [...prev, toast]);

    // Retornar ID para posible referencia
    return id;
  }, [getToastContainer]);

  // Ocultar un toast específico
  const hideToast = useCallback((id) => {
    const toastElement = document.getElementById(`toast-${id}`);
    if (toastElement) {
      toastElement.style.animation = 'toast-out 0.3s ease forwards';
      setTimeout(() => {
        const container = getToastContainer();
        if (container.contains(toastElement)) {
          container.removeChild(toastElement);
        }
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }
  }, [getToastContainer]);

  // Ocultar todos los toasts
  const hideAllToasts = useCallback(() => {
    const container = getToastContainer();
    const toastElements = container.querySelectorAll('[id^="toast-"]');
    toastElements.forEach(element => {
      element.style.animation = 'toast-out 0.3s ease forwards';
    });
    setTimeout(() => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      setToasts([]);
    }, 300);
  }, [getToastContainer]);

  return {
    showToast,
    hideToast,
    hideAllToasts,
    toasts,
  };
};

export default useToast;

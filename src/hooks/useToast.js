import { useState, useCallback } from 'react';

import { createToastElement, applyToastStyles } from './toast-helpers';

/**
 * Hook personalizado para mostrar notificaciones toast
 * @returns {Object} Métodos para mostrar y ocultar toasts
 */
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  // Crear contenedor para los toasts si no existe
  const getToastContainer = useCallback(() => {
    let container = document.querySelector('#toast-container');
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
      document.body.append(container);
    }
    return container;
  }, []);

  // Mostrar un toast
  const showToast = useCallback(
    (message, type = 'info', duration = 3000) => {
      const id = Date.now().toString();
      const newToast = { id, message, type, duration };

      const removeToastFromState = (previousToasts) =>
        previousToasts.filter((t) => t.id !== id);

      const handleCloseAnimation = () => {
        const toastElementToClose = document.querySelector(`#toast-${id}`);
        if (toastElementToClose) {
          toastElementToClose.remove();
        }
        setToasts(removeToastFromState);
      };

      const closeToast = () => {
        const toastElementToClose = document.querySelector(`#toast-${id}`);
        if (toastElementToClose) {
          toastElementToClose.style.animation = 'toast-out 0.3s ease forwards';
          setTimeout(handleCloseAnimation, 300);
        }
      };

      const toastElement = createToastElement(id, message, closeToast);
      applyToastStyles(toastElement, type);

      const container = getToastContainer();
      container.append(toastElement);

      if (!document.querySelector('#toast-styles')) {
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
        document.head.append(styleElement);
      }

      setTimeout(closeToast, duration);

      setToasts((previousToasts) => [...previousToasts, newToast]);

      return id;
    },
    [getToastContainer],
  );

  // Ocultar un toast específico
  const hideToast = useCallback((id) => {
    const toastElement = document.querySelector(`#toast-${id}`);
    if (!toastElement) return;

    const removeToastFromState = (previousToasts) =>
      previousToasts.filter((toast) => toast.id !== id);

    const handleHide = () => {
      if (document.body.contains(toastElement)) {
        toastElement.remove();
      }
      setToasts(removeToastFromState);
    };

    toastElement.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(handleHide, 300);
  }, []);

  // Ocultar todos los toasts
  const hideAllToasts = useCallback(() => {
    const container = getToastContainer();
    const toastElements = container.querySelectorAll('[id^="toast-"]');

    const handleHideAll = () => {
      if (container) {
        while (container.firstChild) {
          container.firstChild.remove();
        }
      }
      setToasts([]);
    };

    for (const element of toastElements) {
      element.style.animation = 'toast-out 0.3s ease forwards';
    }

    if (toastElements.length > 0) {
      setTimeout(handleHideAll, 300);
    }
  }, [getToastContainer]);

  return {
    showToast,
    hideToast,
    hideAllToasts,
    toasts,
  };
};

export default useToast;

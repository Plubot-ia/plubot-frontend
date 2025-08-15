/**
 * @file toast-helpers.js
 * @description Funciones auxiliares para la creación y gestión de notificaciones toast.
 */

/**
 * Aplica estilos a un elemento de toast según su tipo.
 * @param {HTMLElement} element - El elemento del toast.
 * @param {string} type - El tipo de toast (e.g., 'success', 'error').
 */
export const applyToastStyles = (element, type) => {
  let styles;
  switch (type) {
    case 'success': {
      styles = { backgroundColor: '#4caf50', color: 'white' };
      break;
    }
    case 'error': {
      styles = { backgroundColor: '#f44336', color: 'white' };
      break;
    }
    case 'warning': {
      styles = { backgroundColor: '#ff9800', color: 'white' };
      break;
    }
    default: {
      styles = { backgroundColor: '#4facfe', color: 'white' };
      break;
    }
  }
  Object.assign(element.style, styles);
};

/**
 * Crea y configura el elemento DOM para un toast.
 * @param {string} id - El ID único del toast.
 * @param {string} message - El mensaje a mostrar.
 * @param {Function} onClose - La función a llamar cuando se cierra el toast.
 * @returns {HTMLElement} El elemento del toast creado.
 */
export const createToastElement = (id, message, onClose) => {
  const toastElement = document.createElement('div');
  toastElement.id = `toast-${id}`;
  Object.assign(toastElement.style, {
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    minWidth: '250px',
    maxWidth: '350px',
    animation: 'toast-in 0.3s ease forwards',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  });

  const messageElement = document.createElement('span');
  messageElement.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  Object.assign(closeButton.style, {
    background: 'none',
    border: 'none',
    color: 'inherit',
    fontSize: '18px',
    cursor: 'pointer',
    marginLeft: '8px',
    opacity: '0.8',
    transition: 'opacity 0.2s',
  });

  closeButton.addEventListener('mouseover', () => {
    closeButton.style.opacity = '1';
  });
  closeButton.addEventListener('mouseout', () => {
    closeButton.style.opacity = '0.8';
  });
  closeButton.addEventListener('click', onClose);

  toastElement.append(messageElement, closeButton);

  return toastElement;
};

import PropTypes from 'prop-types';
import React from 'react';

// Estilos básicos para el modal, podrían estar en un archivo CSS global.
const modalStyles = `
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-content {
    background: #1a1a2e;
    padding: 2rem;
    border-radius: 8px;
    border: 1px solid #0f3460;
    color: #e0e0ff;
    position: relative;
    min-width: 300px;
    max-width: 80%;
  }
  .modal-close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: transparent;
    border: none;
    color: #e0e0ff;
    font-size: 1.5rem;
    cursor: pointer;
  }
`;

/**
 * Componente genérico para renderizar un modal.
 * Proporciona una superposición y un contenedor de contenido con un botón de cierre.
 */
const Modal = ({ title, isOpen, onClose, children }) => {
  // eslint-disable-next-line unicorn/no-null
  if (!isOpen) return null;

  return (
    <>
      <style>{modalStyles}</style>
      <div className='modal-overlay'>
        <div className='modal-content'>
          {title && <h2>{title}</h2>}
          <button onClick={onClose} className='modal-close-btn'>
            ×
          </button>
          {children}
        </div>
      </div>
    </>
  );
};

Modal.propTypes = {
  title: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default Modal;

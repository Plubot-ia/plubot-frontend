import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './StartNodeError.css';

/**
 * Componente para mostrar mensajes de error en el nodo de inicio
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {string} props.message - Mensaje de error a mostrar
 * @param {string} props.id - ID para accesibilidad
 * @returns {React.ReactElement} Componente StartNodeError
 */
const StartNodeError = memo(({ message, id }) => {
  return (
    <div 
      className="start-node-error" 
      id={id}
      role="alert"
      aria-live="assertive"
    >
      <svg 
        className="start-node-error__icon" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
      </svg>
      <span className="start-node-error__text">{message}</span>
    </div>
  );
});

StartNodeError.displayName = 'StartNodeError';

StartNodeError.propTypes = {
  message: PropTypes.string.isRequired,
  id: PropTypes.string,
};

export default StartNodeError;

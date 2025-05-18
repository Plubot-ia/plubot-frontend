import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './StartNodeControls.css';

/**
 * Componente para mostrar controles rápidos en el nodo de inicio
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onEdit - Función para editar el nodo
 * @param {Function} props.onDelete - Función para eliminar el nodo
 * @param {Function} props.onDuplicate - Función para duplicar el nodo
 * @returns {React.ReactElement} Componente StartNodeControls
 */
const StartNodeControls = memo(({ onEdit, onDelete, onDuplicate }) => {
  return (
    <div className="start-node-controls" role="toolbar" aria-label="Controles del nodo">
      <button
        className="start-node-controls__button start-node-controls__button--edit"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        aria-label="Editar nodo"
        title="Editar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M5 19h1.4l8.625-8.625-1.4-1.4L5 17.6V19ZM19.3 8.925l-4.25-4.2 1.4-1.4q.575-.575 1.413-.575.837 0 1.412.575l1.4 1.4q.575.575.6 1.388.025.812-.55 1.387L19.3 8.925ZM17.85 10.4 7.25 21H3v-4.25l10.6-10.6 4.25 4.25Z"/>
        </svg>
      </button>
      
      <button
        className="start-node-controls__button start-node-controls__button--duplicate"
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
        aria-label="Duplicar nodo"
        title="Duplicar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7 18V2h13v16H7ZM5 22V6H2v16h14v-3H5Zm4-6h7v-2H9v2Zm0-3h7v-2H9v2Zm0-3h7V8H9v2Zm0-3h7V5H9v2Z"/>
        </svg>
      </button>
      
      <button
        className="start-node-controls__button start-node-controls__button--delete"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm('¿Estás seguro de que deseas eliminar este nodo?')) {
            onDelete();
          }
        }}
        aria-label="Eliminar nodo"
        title="Eliminar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7 21q-.825 0-1.412-.587Q5 19.825 5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413Q17.825 21 17 21H7ZM17 6H7v13h10V6ZM9 17h2V8H9v9Zm4 0h2V8h-2v9ZM7 6v13V6Z"/>
        </svg>
      </button>
    </div>
  );
});

StartNodeControls.displayName = 'StartNodeControls';

StartNodeControls.propTypes = {
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
};

export default StartNodeControls;

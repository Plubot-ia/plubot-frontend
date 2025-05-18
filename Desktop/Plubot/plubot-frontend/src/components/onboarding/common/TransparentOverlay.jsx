import React from 'react';
import './TransparentOverlay.css';

/**
 * Componente de overlay transparente para reemplazar cualquier indicador de carga
 * que pueda estar causando un fondo negro
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isVisible - Si el overlay debe ser visible
 * @param {string} props.message - Mensaje a mostrar
 * @returns {JSX.Element|null} - Elemento JSX o null si no es visible
 */
const TransparentOverlay = ({ isVisible, message }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="transparent-overlay">
      <div className="transparent-overlay-content">
        {message}
      </div>
    </div>
  );
};

export default TransparentOverlay;

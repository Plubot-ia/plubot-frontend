import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './ToolTip.css'; // Asegúrate de que los estilos de ToolTip.css sean compatibles

const Tooltip = ({ content, children, position = 'top', delay = 500 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const hideTimeoutRef = useRef(null); // Ref para el temporizador de ocultación

  const portalRoot = document.getElementById('tooltip-portal-root') || document.body;

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipNode = document.querySelector('.tooltip-portal-content');
      let top = 0;
      let left = 0;

      const tooltipHeight = tooltipNode ? tooltipNode.offsetHeight : 40;
      const tooltipWidth = tooltipNode ? tooltipNode.offsetWidth : 100;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipHeight - 5;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);
          break;
        case 'bottom':
          top = triggerRect.bottom + 5;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipHeight / 2);
          left = triggerRect.left - tooltipWidth - 5;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipHeight / 2);
          left = triggerRect.right + 5;
          break;
        default:
          top = triggerRect.top - tooltipHeight - 5;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);
      }

      top += window.scrollY;
      left += window.scrollX;

      if (left < 0) left = 5;
      if (top < 0) top = 5;

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  // Limpiar el temporizador al desmontar el componente
  useEffect(() => {
    return () => {
      clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const handleMouseEnterTrigger = () => {
    clearTimeout(hideTimeoutRef.current); // Cancelar cualquier intento de ocultar
    setIsVisible(true);
  };

  const handleMouseLeaveTrigger = () => {
    // Iniciar temporizador para ocultar el tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, delay);
  };

  const handleMouseEnterTooltipContent = () => {
    clearTimeout(hideTimeoutRef.current); // Mantener visible si el mouse entra al contenido
  };

  const handleMouseLeaveTooltipContent = () => {
    // Iniciar temporizador para ocultar el tooltip si el mouse sale de su contenido
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, delay);
  };

  const tooltipJsx = isVisible ? (
    ReactDOM.createPortal(
      <div
        className={`tooltip-portal-content tooltip-content tooltip-content--${position}`}
        style={{
          position: 'absolute',
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          zIndex: 99999, // Aumentado drásticamente para superar otros elementos
          pointerEvents: 'all', // Asegurar que el tooltip capture eventos del mouse
        }}
        onMouseEnter={handleMouseEnterTooltipContent}
        onMouseLeave={handleMouseLeaveTooltipContent}
      >
        {typeof content === 'string' ?
          content.split('\n').map((line, index, arr) => (
            <React.Fragment key={index}>
              {line}
              {index < arr.length - 1 && <br />}
            </React.Fragment>
          ))
          : content
        }
      </div>,
      portalRoot
    )
  ) : null;

  return (
    <div
      className="tooltip-trigger-wrapper"
      ref={triggerRef}
      onMouseEnter={handleMouseEnterTrigger}
      onMouseLeave={handleMouseLeaveTrigger}
      onFocus={handleMouseEnterTrigger} // Reutilizar lógica para mostrar en foco
      onBlur={() => { /* console.log('Trigger blurred, doing nothing for now'); */ }} // Diagnóstico: onBlur no cierra el tooltip temporalmente
      tabIndex={0}
    >
      {children}
      {tooltipJsx}
    </div>
  );
};

export default Tooltip;
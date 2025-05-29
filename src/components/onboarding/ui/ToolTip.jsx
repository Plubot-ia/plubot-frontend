import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './ToolTip.css'; // Asegúrate de que los estilos de ToolTip.css sean compatibles

const Tooltip = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const portalRoot = document.getElementById('tooltip-portal-root') || document.body;

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipNode = document.querySelector('.tooltip-portal-content'); // Asume que solo hay uno visible a la vez o usa un ID único
      let top = 0;
      let left = 0;

      // Estimación básica del tamaño del tooltip, idealmente se mediría
      const tooltipHeight = tooltipNode ? tooltipNode.offsetHeight : 40; 
      const tooltipWidth = tooltipNode ? tooltipNode.offsetWidth : 100;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipHeight - 5; // 5px de espacio
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

      // Ajustar para scroll y asegurar que no se salga de la pantalla (simplificado)
      top += window.scrollY;
      left += window.scrollX;

      // Asegurar que no se salga de los bordes (muy básico)
      if (left < 0) left = 5;
      if (top < 0) top = 5;
      // Podrías añadir lógica para que no se salga por la derecha/abajo también

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  const tooltipJsx = isVisible ? (
    ReactDOM.createPortal(
      <div // Cambiado de span a div para mejor manejo de layout si es necesario
        className={`tooltip-portal-content tooltip-content tooltip-content--${position}`}
        style={{
          position: 'absolute',
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          // Los estilos de ToolTip.css (background, color, padding, etc.) se aplicarán aquí
          // zIndex es importante para que esté sobre otros elementos
          zIndex: 10000, // Un z-index alto para asegurar visibilidad
        }}
      >
        {typeof content === 'string' ? 
          content.split('\\n').map((line, index, arr) => (
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
      className="tooltip-trigger-wrapper" // Renombrado de tooltip-wrapper para claridad
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip} // Para accesibilidad
      onBlur={hideTooltip}    // Para accesibilidad
      tabIndex={0} // Para que sea enfocable si no lo es ya
    >
      {children}
      {tooltipJsx}
    </div>
  );
};

export default Tooltip;
import React from 'react';
import './ToolTip.css'; // Opcional: para estilos

const Tooltip = ({ content, children }) => {
  return (
    <div className="tooltip-wrapper">
      {children}
      <span className="tooltip-content">{content}</span>
    </div>
  );
};

export default Tooltip;
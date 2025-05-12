import React from 'react';
import { Handle, Position } from 'reactflow';
import './PowerNode.css'; // Asumimos que PowerNode.css estará en el mismo directorio

const PowerNode = ({ data, isConnectable }) => {
  // data contendrá: label, powerId, powerTitle, powerIcon, powerDescription, powerCategory, config, status

  return (
    <div className="plb-power-node">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="plb-power-node-handle"
      />
      <div className="plb-power-node-header">
        <span className="plb-power-node-icon">{data.powerIcon || '⚡'}</span>
        <span className="plb-power-node-title">{data.powerTitle || data.label || 'Power Node'}</span>
      </div>
      {data.powerDescription && (
        <div className="plb-power-node-description">
          {data.powerDescription}
        </div>
      )}
      {/* Aquí podríamos añadir un indicador de estado o un botón de configuración */}
      {/* <div className="plb-power-node-status">{data.status?.message || 'No configurado'}</div> */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="plb-power-node-handle"
      />
    </div>
  );
};

export default PowerNode;

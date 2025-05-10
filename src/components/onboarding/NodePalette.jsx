import React, { useState } from 'react';
import './NodePalette.css';

const NodePalette = ({ setNodes, setByteMessage }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    
    // Opcional: Mensaje de ayuda al arrastrar
    setByteMessage(`Arrastra y suelta para crear un nodo de ${nodeType}`);
  };
  
  const onDragEnd = () => {
    setIsDragging(false);
    setByteMessage('Nodo colocado en el diagrama. Conéctalo con otros nodos.');
  };

  const nodeTypes = [
    { type: 'start', label: 'Inicio', icon: 'fas fa-play' },
    { type: 'message', label: 'Mensaje', icon: 'fas fa-comment-alt' },
    { type: 'decision', label: 'Decisión', icon: 'fas fa-code-branch' },
    { type: 'action', label: 'Acción', icon: 'fas fa-bolt' },
    { type: 'end', label: 'Fin', icon: 'fas fa-stop' }
  ];

  return (
    <div className={`ts-node-palette ${isExpanded ? 'ts-expanded' : 'ts-collapsed'} ${isDragging ? 'ts-dragging' : ''}`}>
      <div 
        className="ts-palette-header" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4>Biblioteca de Nodos</h4>
        <span className="ts-toggle-icon">{isExpanded ? '◀' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="ts-palette-nodes">
          {nodeTypes.map(node => (
            <div
              key={node.type}
              className={`ts-draggable-node ts-${node.type}-template`}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              onDragEnd={onDragEnd}
              title={`Añadir nodo de ${node.label}`}
            >
              <i className={node.icon}></i>
              <span>{node.label}</span>
            </div>
          ))}
          
          <div className="ts-palette-info">
            <p>Arrastra nodos al diagrama</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodePalette;
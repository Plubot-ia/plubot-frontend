import React from 'react';
import useFlowStore from '@/stores/useFlowStore';
import './CustomMiniMap.css';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Maximize2, Minimize2, Move } from 'lucide-react'; // Añadido icono Move

// Creamos un componente personalizado que simula un MiniMap
// sin usar el componente MiniMap de ReactFlow directamente
const CustomMiniMap = () => {
  // Obtener el estado del store de Flow
  const { isUltraMode, nodes, edges, setNodes, fitView } = useFlowStore(state => ({
    isUltraMode: state.isUltraMode,
    nodes: state.nodes,
    edges: state.edges,
    setNodes: state.setNodes,
    fitView: state.fitView
  }));
  
  // Estado local para asegurar que los nodos tengan IDs únicos en el minimap
  const [minimapNodes, setMinimapNodes] = useState([]);
  // Estado para controlar si el mapa está contraído o expandido (inicia contraído)
  const [isCollapsed, setIsCollapsed] = useState(true);
  // Estado para controlar el arrastre del mapa
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef(null);
  
  // Procesar los nodos para asegurar IDs únicos
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      const processedNodes = nodes.map((node, index) => ({
        ...node,
        minimapId: `minimap-${node.id}-${index}` // Crear un ID único para el minimap
      }));
      setMinimapNodes(processedNodes);
    }
  }, [nodes]);
  
  // Función para alternar entre estado contraído y expandido
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Función para iniciar el arrastre del mapa
  const handleMouseDown = useCallback((e) => {
    if (isCollapsed) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  }, [isCollapsed]);

  // Función para manejar el movimiento durante el arrastre
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || isCollapsed) return;
    
    const dx = (e.clientX - dragStart.x) * 10; // Factor de escala para el movimiento
    const dy = (e.clientY - dragStart.y) * 10;
    
    // Actualizar la posición de todos los nodos
    if (nodes && nodes.length > 0) {
      const updatedNodes = nodes.map(node => ({
        ...node,
        position: {
          x: node.position.x - dx,
          y: node.position.y - dy
        }
      }));
      
      setNodes(updatedNodes);
    }
    
    // Actualizar el punto de inicio para el próximo movimiento
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  }, [isDragging, isCollapsed, dragStart, nodes, setNodes]);

  // Función para finalizar el arrastre
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Ajustar la vista después de mover los nodos
      setTimeout(() => {
        if (fitView) fitView({ padding: 0.2 });
      }, 100);
    }
  }, [isDragging, fitView]);

  // Añadir y eliminar event listeners para el arrastre
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className={`custom-minimap ${isUltraMode ? 'ultra-mode' : ''} ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      {isCollapsed ? (
        // Vista contraída (burbuja)
        <div className="custom-minimap-bubble" onClick={toggleCollapse}>
          <div className="custom-minimap-bubble-content">
            {/* Versión miniatura de los nodos */}
            {minimapNodes.slice(0, 5).map(node => (
              <div 
                key={node.minimapId}
                className={`custom-minimap-node-mini ${node.type || 'default'}`}
                style={{
                  backgroundColor: getNodeColor(node)
                }}
              />
            ))}
          </div>
          <div className="custom-minimap-toggle-icon">
            <Maximize2 size={16} />
          </div>
        </div>
      ) : (
        // Vista expandida (mapa completo)
        <div className="custom-minimap-content">
          {/* Botón para contraer */}
          <div className="custom-minimap-toggle" onClick={toggleCollapse}>
            <Minimize2 size={16} />
          </div>
          
          {/* Indicador de modo de arrastre */}
          <div className="custom-minimap-drag-indicator" style={{ opacity: isDragging ? 1 : 0 }}>
            <Move size={16} />
            <span>Arrastrando mapa</span>
          </div>

          {/* Representación simplificada del mapa */}
          <div 
            className={`custom-minimap-nodes ${isDragging ? 'dragging' : ''}`}
            onMouseDown={handleMouseDown}
            ref={mapContainerRef}
            style={{ cursor: isCollapsed ? 'default' : 'move' }}>
            {/* Renderizar las aristas primero para que estén debajo de los nodos */}
            <svg className="custom-minimap-edges" width="100%" height="100%">
              {edges.map(edge => {
                // Buscar los nodos de origen y destino
                const sourceNode = minimapNodes.find(n => n.id === edge.source);
                const targetNode = minimapNodes.find(n => n.id === edge.target);
                
                if (!sourceNode || !targetNode) return null;
                
                // Calcular las posiciones en el minimapa
                const sourceX = (sourceNode.position?.x || 0) / 10;
                const sourceY = (sourceNode.position?.y || 0) / 10;
                const targetX = (targetNode.position?.x || 0) / 10;
                const targetY = (targetNode.position?.y || 0) / 10;
                
                return (
                  <line 
                    key={`minimap-edge-${edge.id}`}
                    x1={`${sourceX}%`}
                    y1={`${sourceY}%`}
                    x2={`${targetX}%`}
                    y2={`${targetY}%`}
                    stroke="#00e0ff"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                );
              })}
            </svg>
            
            {/* Renderizar los nodos encima de las aristas */}
            {minimapNodes.map(node => (
              <div 
                key={node.minimapId} // Usar el ID único para el minimap
                className={`custom-minimap-node ${node.type || 'default'}`}
                style={{
                  left: `${(node.position?.x || 0) / 10}%`,
                  top: `${(node.position?.y || 0) / 10}%`,
                  backgroundColor: getNodeColor(node),
                  zIndex: 2 // Asegurar que los nodos estén por encima de las aristas
                }}
              />
            ))}
          </div>
          <div className="custom-minimap-mask" />
        </div>
      )}
    </div>
  );
};

// Función auxiliar para determinar el color de los nodos
const getNodeColor = (node) => {
  if (node.style?.background) return node.style.background;
  if (node.type === 'start') return '#4CAF50';
  if (node.type === 'end') return '#F44336';
  if (node.type === 'decision') return '#FFC107';
  if (node.type === 'action') return '#2196F3';
  return '#00E0FF';
};

export default CustomMiniMap;

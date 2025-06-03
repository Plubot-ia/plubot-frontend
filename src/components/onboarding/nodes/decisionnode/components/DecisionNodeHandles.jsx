/**
 * @file DecisionNodeHandles.jsx
 * @description Componente para los conectores del nodo de decisión
 */

import React, { useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { NODE_CONFIG, getConnectorColor } from '../DecisionNode.types';

// Constantes para el posicionamiento de los handles
const HANDLE_SIZE = 15; // tamaño del handle en px
const NODE_PADDING = 20; // padding del nodo en px

/**
 * Componente para los conectores del nodo de decisión
 */
const DecisionNodeHandles = ({ 
  nodeId, 
  outputs = [], 
  isConnectable = true, 
  isUltraPerformanceMode = false,
  isEditing = false,
  activeOutputs = []
}) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const containerRef = useRef(null);

  useEffect(() => {
    if (nodeId) {
      // A small delay can sometimes help ensure React Flow
      // has processed other pending updates before re-calculating internals.
      // It also helps batch multiple rapid changes.
      const timer = setTimeout(() => {
        updateNodeInternals(nodeId);
      }, 50); // 50ms delay, can be adjusted or removed if not needed
      return () => clearTimeout(timer);
    }
  }, [nodeId, outputs.length, updateNodeInternals]);

  // useEffect(() => {
  //   const updateTimer = setTimeout(() => {
  //     if (nodeId) {
  //       updateNodeInternals(nodeId);
  //     }
  //   }, 150);
  //   return () => {
  //     clearTimeout(updateTimer);
  //   };
  // }, [nodeId, outputs.length, updateNodeInternals]);

  // useEffect(() => {
  //   updateNodeInternals(nodeId);
  //   if (containerRef.current) {
  //     const observer = new MutationObserver(() => {
  //       updateNodeInternals(nodeId);
  //     });
  //     observer.observe(containerRef.current.parentNode, {
  //       attributes: true,
  //       childList: true,
  //       subtree: true
  //     });
  //     return () => observer.disconnect();
  //   }
  // }, [nodeId, updateNodeInternals]);

  // useEffect(() => {
  //   updateNodeInternals(nodeId);
  //   const timer = setTimeout(() => {
  //     updateNodeInternals(nodeId);
  //   }, 100);
  //   return () => clearTimeout(timer);
  // }, [nodeId, activeOutputs, updateNodeInternals]);

  // Renderizar los handles
  const renderSourceHandles = useMemo(() => {
    return outputs.map((output, index) => {
      // Calcular posición horizontal para una distribución uniforme
      const numHandles = outputs.length;
      const positionPercent = (index + 1) * (100 / (numHandles + 1));
      
      // Determinar color del handle basado en el tipo de condición
      // Para las condiciones true/false, usamos el ID directamente
      // Para otras condiciones, usamos el índice para seleccionar de la paleta
      const finalColor = getConnectorColor(output.text, index);
      
      // Determinar la clase CSS basada en el tipo de condición
      let handleClass = 'decision-node__handle--source';
      if (output.id === 'true') {
        handleClass += ' custom-handle-true';
      } else if (output.id === 'false') {
        handleClass += ' custom-handle-false';
      }
      
      const handleStyle = {
        // Posicionamiento exacto
        left: `${positionPercent}%`,
        bottom: `-${HANDLE_SIZE/2}px`,
        top: 'auto !important',
        position: 'absolute !important',
        transition: 'none !important', // Evitar animaciones durante el drag
        transform: 'translateX(-50%) !important',
        transformOrigin: 'center center !important',
        width: `${HANDLE_SIZE}px`,
        height: `${HANDLE_SIZE}px`,
        backgroundColor: finalColor,
        border: '2px solid #ffffff',
        borderRadius: '50%',
        zIndex: 50,
        pointerEvents: 'all',
        margin: 0,
        padding: 0
      };

      if (numHandles > 2) {
        handleStyle.left = `${positionPercent}% !important`;
        handleStyle.right = 'auto !important';
      }

      return (
        <Handle
          key={output.id} // Key can remain simple output.id for React's rendering
          type="source"
          position={Position.Bottom}
          id={`output-${output.id}`} // This ID must match the edge's sourceHandle
          className={`decision-node__handle ${handleClass}`}
          isConnectable={isConnectable && !isEditing}
          style={handleStyle}
          data-color={finalColor}
          data-testid={`handle-source-${output.id}`}
        />
      );
    });
  }, [outputs, isConnectable, isEditing, isUltraPerformanceMode, activeOutputs]);
  
  return (
    <div 
      ref={containerRef}
      className="decision-node__handles-container" 
      data-testid="decision-node-source-handles"
      style={{
        position: 'absolute !important',
        width: '100%',
        left: 0,
        right: 0,
        height: 0,
        overflow: 'visible',
        bottom: 0, // Posicionar en el borde inferior exacto del nodo
        zIndex: 50,
        pointerEvents: 'none', // Permitir que los eventos pasen a través del contenedor a los handles
        transform: 'none !important', // Propiedad crítica para evitar que React Flow modifique la posición
        transformOrigin: 'center center !important',
        alignItems: 'center',
        margin: 0,
        padding: 0
      }}
    >
      {renderSourceHandles}
    </div>
  );
};

DecisionNodeHandles.propTypes = {
  nodeId: PropTypes.string.isRequired,
  outputs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  })),
  isConnectable: PropTypes.bool,
  isUltraPerformanceMode: PropTypes.bool,
  isEditing: PropTypes.bool,
  activeOutputs: PropTypes.arrayOf(PropTypes.string),
};

// Memorizar el componente completo al exportarlo
export default React.memo(DecisionNodeHandles);

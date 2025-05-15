/**
 * @file DecisionNodeHandles.jsx
 * @description Componente para los conectores del nodo de decisión
 */

import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import { NODE_CONFIG, getConnectorColor } from '../DecisionNode.types';

/**
 * Componente para los conectores del nodo de decisión
 * @param {Object} props - Propiedades del componente
 * @param {Array<string>} props.outputs - Lista de condiciones/salidas
 * @param {boolean} props.isConnectable - Indica si los conectores pueden conectarse
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @param {boolean} props.isEditing - Indica si está en modo edición
 * @param {Array<number>} props.activeOutputs - Índices de las salidas activas
 * @returns {JSX.Element} - Conectores del nodo
 */
const DecisionNodeHandles = memo(({ 
  outputs, 
  isConnectable, 
  isUltraPerformanceMode,
  isEditing,
  activeOutputs = []
}) => {
  // ELIMINADO EL HANDLE DE ENTRADA (SUPERIOR) PARA EVITAR EL HANDLE EXTRA
  
  // Conectores de salida (inferiores) - CORREGIDO PARA ELIMINAR HANDLES EXTRAS
  const renderSourceHandles = useMemo(() => {
    // Validación estricta para asegurar que outputs sea exactamente lo que esperamos
    if (!Array.isArray(outputs) || outputs.length === 0) return null;
    
    // Filtrar SOLO las condiciones que son exactamente "Sí" o "No" para evitar handles extras
    // Esto es una solución más estricta para asegurar que solo tengamos los handles necesarios
    const validOutputs = outputs.filter(output => {
      if (!output || typeof output !== 'string') return false;
      const normalized = output.trim().toLowerCase();
      return normalized === 'sí' || normalized === 'si' || normalized === 'no';
    });
    
    // Log para depuración
    console.log('Outputs filtrados estrictamente:', validOutputs);
    
    return validOutputs.map((output, index) => {
      const totalHandles = validOutputs.length;
      const spacing = 100 / (totalHandles + 1);
      const position = (index + 1) * spacing;
      
      // Determinar color basado en el tipo de condición
      let handleColor;
      const normalized = output.toLowerCase();
      if (normalized === 'sí' || normalized === 'si') {
        handleColor = '#22c55e'; // Verde para "sí"
      } else if (normalized === 'no') {
        handleColor = '#ef4444'; // Rojo para "no"
      } else {
        handleColor = '#1e40af'; // Azul por defecto (no debería llegar aquí)
      }
      
      return (
        <div key={`handle-${index}`} className="decision-node__handle-container">
          <Handle
            type="source"
            position={Position.Bottom}
            id={`output-${index}`}
            isConnectable={isConnectable && !isEditing}
            className={`decision-node__handle decision-node__handle--source`}
            style={{
              left: `${position}%`,
              backgroundColor: handleColor,
              // Posicionar el handle más hacia afuera para mayor visibilidad
              bottom: '-20px',
              zIndex: 100,
              width: '16px',
              height: '16px',
              border: '3px solid white',
              boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
          {/* Se ha eliminado el texto junto a los handles por solicitud del usuario */}
        </div>
      );
    });
  }, [outputs, isConnectable, isEditing, isUltraPerformanceMode, activeOutputs]);
  
  return (
    <div className="decision-node__handles">
      {/* Se ha eliminado el handle de entrada (target) para evitar el handle extra */}
      <div className="decision-node__handle-wrapper">
        {renderSourceHandles}
      </div>
    </div>
  );
});

DecisionNodeHandles.displayName = 'DecisionNodeHandles';

DecisionNodeHandles.propTypes = {
  outputs: PropTypes.arrayOf(PropTypes.string).isRequired,
  isConnectable: PropTypes.bool,
  isUltraPerformanceMode: PropTypes.bool,
  isEditing: PropTypes.bool,
  activeOutputs: PropTypes.arrayOf(PropTypes.number)
};

export default DecisionNodeHandles;

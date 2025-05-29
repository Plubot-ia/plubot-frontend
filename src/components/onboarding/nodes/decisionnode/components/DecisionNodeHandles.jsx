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
 * @param {Array<Object>} props.outputs - Lista de condiciones/salidas
 * @param {boolean} props.isConnectable - Indica si los conectores pueden conectarse
 * @param {boolean} props.isUltraPerformanceMode - Indica si está en modo ultra rendimiento
 * @param {boolean} props.isEditing - Indica si está en modo edición
 * @param {Array<string>} props.activeOutputs - IDs de las salidas activas
 * @returns {JSX.Element} - Conectores del nodo
 */
const DecisionNodeHandles = memo(({ 
  outputs, 
  isConnectable, 
  isUltraPerformanceMode,
  isEditing,
  activeOutputs = []
}) => {
  
  const renderSourceHandles = useMemo(() => {
    if (!Array.isArray(outputs) || outputs.length === 0) {
      console.warn('DecisionNodeHandles: outputs prop no es un array válido o está vacío.');
      return null;
    }
    
    return outputs.map((output, index) => {
      if (!output || typeof output.id !== 'string' || typeof output.text !== 'string') {
        console.warn('DecisionNodeHandles: output item inválido en el array outputs:', output);
        return null; // Omitir handle si el output no tiene la estructura esperada
      }

      const totalHandles = outputs.length;
      // Ajustar espaciado para que los handles no se superpongan y estén bien distribuidos
      // Si hay 1 handle, centrado. Si hay 2, 25% y 75%. Si hay 3, 20%, 50%, 80% etc.
      let positionPercent;
      if (totalHandles === 1) {
        positionPercent = 50;
      } else {
        positionPercent = (100 / (totalHandles + 1)) * (index + 1);
      }
      
      const handleColor = getConnectorColor(output.text); // Usar la función de types.js
      
      return (
        // El div contenedor por handle podría no ser necesario si el Handle se estiliza directamente
        // Pero lo mantenemos por ahora si se necesitan elementos adicionales por handle (como texto)
        <Handle
          key={`handle-source-${output.id}`}
          type="source"
          position={Position.Bottom}
          id={`output-${output.id}`} // ID único y estable basado en el id de la condición/opción
          isConnectable={isConnectable && !isEditing}
          className={`decision-node__handle decision-node__handle--source ${isUltraPerformanceMode ? 'decision-node__handle--ultra' : ''}`}
          style={{
            left: `${positionPercent}%`,
            backgroundColor: handleColor,
            width: isUltraPerformanceMode ? '10px' : '14px',
            height: isUltraPerformanceMode ? '10px' : '14px',
            border: isUltraPerformanceMode ? '2px solid var(--handle-ultra-border-color, #555)' : `3px solid ${handleColor === '#ffffff' || handleColor === 'white' ? '#cccccc' : 'white'}`, // Borde blanco, o gris si el handle es blanco
            boxShadow: isUltraPerformanceMode ? 'none' : '0 1px 3px rgba(0,0,0,0.2)',
            borderRadius: '50%',
            zIndex: 100, // Asegurar que esté por encima de otros elementos del nodo
            transition: isUltraPerformanceMode ? 'none' : 'all 0.2s ease',
          }}
          data-testid={`handle-source-${output.id}`}
        />
      );
    });
  }, [outputs, isConnectable, isEditing, isUltraPerformanceMode]);
  
  return (
    <div className="decision-node__handles-container"> {/* Cambiado de decision-node__handles para evitar confusión con la clase del handle individual */}
      {/* El handle de entrada (target) se renderizará en DecisionNode.jsx */}
      <div className="decision-node__source-handles-wrapper"> {/* Wrapper específico para los source handles */}
        {renderSourceHandles}
      </div>
    </div>
  );
});

DecisionNodeHandles.displayName = 'DecisionNodeHandles';

DecisionNodeHandles.propTypes = {
  outputs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    // Podrían incluirse más propiedades si fueran necesarias para el handle
  })).isRequired,
  isConnectable: PropTypes.bool,
  isUltraPerformanceMode: PropTypes.bool,
  isEditing: PropTypes.bool,
  activeOutputs: PropTypes.arrayOf(PropTypes.string) // Cambiado a array de strings (IDs de output)
};

export default DecisionNodeHandles;

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import PropTypes from 'prop-types';
import './PowerNode.css'; // Asumimos que PowerNode.css estará en el mismo directorio

const PowerNodeComponent = ({
  id,
  data,
  isConnectable,
  isUltraPerformanceMode = false,
}) => {
  // INSTRUMENTATION: Log de render de nodos
  useEffect(() => {
    const memoStatus = 'Memoized: Yes (React.memo)';
    console.log(`[Render] Nodo ${id} - Tipo: PowerNode - LOD: ${data.lodLevel} - ${memoStatus}`);
  }, [id, data.lodLevel]);

  // data contendrá: label, powerId, powerTitle, powerIcon, powerDescription, powerCategory, config, status

  return (
    <div
      className={`plb-power-node${isUltraPerformanceMode ? ' ultra-performance' : ''}`}
      style={{
        transition: isUltraPerformanceMode ? 'none' : undefined,
        boxShadow: isUltraPerformanceMode ? 'none' : undefined,
      }}
    >
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

PowerNodeComponent.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.shape({
    label: PropTypes.string,
    powerId: PropTypes.string,
    powerTitle: PropTypes.string,
    powerIcon: PropTypes.node,
    powerDescription: PropTypes.string,
  }).isRequired,
  isConnectable: PropTypes.bool,
  isUltraPerformanceMode: PropTypes.bool,
};

const arePropsEqual = (prevProps, nextProps) => {
  if (
    prevProps.isConnectable !== nextProps.isConnectable ||
    prevProps.isUltraPerformanceMode !== nextProps.isUltraPerformanceMode
  ) {
    return false;
  }

  const prevData = prevProps.data || {};
  const nextData = nextProps.data || {};

  return (
    prevData.label === nextData.label &&
    prevData.powerTitle === nextData.powerTitle &&
    prevData.powerIcon === nextData.powerIcon &&
    prevData.powerDescription === nextData.powerDescription
  );
};

const PowerNode = memo(PowerNodeComponent, arePropsEqual);

PowerNode.displayName = 'PowerNode';

export default PowerNode;

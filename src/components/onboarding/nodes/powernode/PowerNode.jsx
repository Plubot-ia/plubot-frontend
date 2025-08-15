import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

import { useRenderTracker } from '@/utils/renderTracker';
import './PowerNode.css';

const PowerNodeComponent = ({ data, isConnectable, isUltraPerformanceMode = false }) => {
  // 🔄 RENDER TRACKING
  useRenderTracker('PowerNode', [data?.powerId, data?.label]);

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
        type='target'
        position={Position.Top}
        isConnectable={isConnectable}
        className='plb-power-node-handle'
      />
      <div className='plb-power-node-header'>
        <span className='plb-power-node-icon'>{data.powerIcon || '⚡'}</span>
        <span className='plb-power-node-title'>
          {data.powerTitle || data.label || 'Power Node'}
        </span>
      </div>
      {data.powerDescription && (
        <div className='plb-power-node-description'>{data.powerDescription}</div>
      )}
      {/* Aquí podríamos añadir un indicador de estado o un botón de configuración */}
      {/* <div className="plb-power-node-status">{data.status?.message || 'No configurado'}</div> */}
      <Handle
        type='source'
        position={Position.Bottom}
        isConnectable={isConnectable}
        className='plb-power-node-handle'
      />
    </div>
  );
};

PowerNodeComponent.propTypes = {
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

const arePropertiesEqual = (previousProperties, nextProperties) => {
  if (
    previousProperties.isConnectable !== nextProperties.isConnectable ||
    previousProperties.isUltraPerformanceMode !== nextProperties.isUltraPerformanceMode
  ) {
    return false;
  }

  const previousData = previousProperties.data ?? {};
  const nextData = nextProperties.data ?? {};

  return (
    previousData.label === nextData.label &&
    previousData.powerTitle === nextData.powerTitle &&
    previousData.powerIcon === nextData.powerIcon &&
    previousData.powerDescription === nextData.powerDescription
  );
};

const PowerNode = memo(PowerNodeComponent, arePropertiesEqual);

PowerNode.propTypes = PowerNodeComponent.propTypes;

PowerNode.displayName = 'PowerNode';

export default PowerNode;

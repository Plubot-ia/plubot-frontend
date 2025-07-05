/**
 * @file EndNode.tsx
 * @description Componente optimizado para representar el nodo final en el editor de flujos PLUBOT.
 * @author PLUBOT Team
 * @version 5.0.0 (Refactored for simplicity and performance)
 */

import { memo } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import type { NodeProps as RFNodeProperties } from 'reactflow';

import { cn } from '@/lib/utils';
import useFlowStore from '@/stores/use-flow-store';

import Tooltip from '../../ui/ToolTip';

import { END_NODE_ZOD_SCHEMA, type EndNodeData } from './endNode.schema';

import './EndNode.css';

// --- COMPONENTE PRINCIPAL ---
const EndNode = memo<RFNodeProperties<EndNodeData>>(
  ({ id: nodeId, data, selected }) => {
    const { getEdges } = useReactFlow();
    const isUltraPerformance = useFlowStore((state) => state.isUltraMode);

    const incomingEdges = getEdges().filter(
      (edge) => edge.target === nodeId,
    ).length;

    const endNodeData = {
      ...data,
      label: data.label || 'Fin',
      highlight: data.highlight || false,
      dynamicContent: data.dynamicContent || 'Este es el final del flujo.',
      connections: incomingEdges,
      lastRun: data.lastRun || new Date().toLocaleDateString(),
    };

    return (
      <div
        className={cn(
          'end-node',
          { 'ultra-performance': isUltraPerformance },
          { 'end-node-highlight': endNodeData.highlight },
          { selected: selected },
        )}
      >
        <Handle
          type='target'
          position={Position.Left}
          className='end-node-handle end-node-handle--target'
          isConnectable
        />
        <div className='end-node-title'>{endNodeData.label}</div>
        <div className='end-node-content'>{endNodeData.dynamicContent}</div>
        <div className='end-node-elite-info'>
          <Tooltip
            content={`Número de flujos que finalizan aquí: ${endNodeData.connections}`}
            position='top'
            delay={300}
          >
            <span>Conexiones: {endNodeData.connections}</span>
          </Tooltip>
          <Tooltip
            content='Fecha de la última ejecución de este nodo.'
            position='top'
            delay={300}
          >
            <span>Última Ejecución: {endNodeData.lastRun}</span>
          </Tooltip>
        </div>
        <div className='end-node-indicator' />
      </div>
    );
  },
);

EndNode.displayName = 'EndNode';

export default EndNode;

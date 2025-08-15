/**
 * @file EndNode.tsx
 * @description Componente optimizado para representar el nodo final en el editor de flujos PLUBOT.
 * @author PLUBOT Team
 * @version 5.0.0 (Refactored for simplicity and performance)
 */

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps as RFNodeProperties } from 'reactflow';

import { cn } from '@/lib/utils';
import useFlowStore from '@/stores/use-flow-store';
import { memoComparison } from '@/utils/logControl';
import { useRenderTracker } from '@/utils/renderTracker';

import Tooltip from '../../ui/ToolTip';

import { type EndNodeData } from './endNode.schema';

import './EndNode.css';

// --- COMPONENTE PRINCIPAL ---
const EndNodeComponent = ({ id: nodeId, data, selected }: RFNodeProperties<EndNodeData>) => {
  // 🔄 RENDER TRACKING
  useRenderTracker('EndNode', [nodeId, selected]);

  // OPTIMIZED: Get edges directly from store to avoid re-renders
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  const edges = useFlowStore((state: any) => state.edges) as any[];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  const incomingEdges = edges.filter((edge: any) => edge.target === nodeId).length;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  const isUltraPerformance = useFlowStore((state: any) => state.isUltraMode) as boolean;

  const endNodeData = {
    ...data,

    label: data.label || 'Fin',

    highlight: data.highlight ?? false,

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
        id='input'
        className='end-node-handle end-node-handle--target'
        isConnectable
        aria-label='Conector de entrada'
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
        <Tooltip content='Fecha de la última ejecución de este nodo.' position='top' delay={300}>
          <span>Última Ejecución: {endNodeData.lastRun}</span>
        </Tooltip>
      </div>
      <div className='end-node-indicator' />
    </div>
  );
};

EndNodeComponent.displayName = 'EndNodeComponent';

// Custom comparison function for EndNode React.memo optimization
const EndNodeOptimized = memo<RFNodeProperties<EndNodeData>>(
  EndNodeComponent,
  (prevProps, nextProps) => {
    // Return TRUE if props are EQUAL (don't re-render)
    // Return FALSE if props are DIFFERENT (do re-render)

    // Log render attempts for debugging
    memoComparison(
      'EndNode memo comparison',
      {
        id: nextProps.id,
        selectedChanged: prevProps.selected !== nextProps.selected,
        dataChanged: prevProps.data !== nextProps.data,
      },
      'EndNode',
    );

    // Check critical props that should trigger re-renders
    if (prevProps.id !== nextProps.id || prevProps.selected !== nextProps.selected) {
      memoComparison('EndNode re-rendering due to prop changes', {}, 'EndNode');
      return false; // Props changed, re-render
    }

    // Deep comparison for data object
    if (prevProps.data !== nextProps.data) {
      // Check if data properties actually changed
      const prevData = prevProps.data ?? {};
      const nextData = nextProps.data ?? {};

      if (
        prevData.label !== nextData.label ||
        prevData.highlight !== nextData.highlight ||
        prevData.dynamicContent !== nextData.dynamicContent ||
        prevData.lastRun !== nextData.lastRun
      ) {
        memoComparison('EndNode re-rendering due to data changes', {}, 'EndNode');
        return false; // Data changed, re-render
      }
    }

    memoComparison('EndNode skipping render (props equal)', {}, 'EndNode');
    return true; // Props are equal, skip re-render
  },
);

const EndNode = EndNodeOptimized;
EndNode.displayName = 'EndNode';

export default EndNode;

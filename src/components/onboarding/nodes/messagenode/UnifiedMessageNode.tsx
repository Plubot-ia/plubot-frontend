/**
 * @file UnifiedMessageNode.tsx
 * @description Componente unificado de MessageNode que maneja todos los niveles de LOD internamente
 * para evitar desmontaje/remontaje y desconexión de aristas.
 * @author PLUBOT Team
 * @version 5.0.0 - DEFINITIVE FIX
 */

import React, { memo, useRef, useEffect } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

import { LOD_LEVELS } from '@/components/onboarding/flow-editor/utils/lodUtilities';

// Import the three LOD versions
import CompactMessageNode from './CompactMessageNode';
import MessageNodeFull from './MessageNode';
import type { MessageType } from './MessageNodeIcon';
import MiniMessageNode from './MiniMessageNode';

// Define MessageNodeData interface
interface MessageNodeData {
  message?: string;
  type?: MessageType;
  messageType?: string;
  label?: string;
  variables?: Array<{ name: string; value: string }>;
  lastUpdated?: string;
  lodLevel?: string;
  title?: string;
}

// Handle styles that CANNOT be overridden by CSS
const handleStyleTop = {
  position: 'absolute' as const,
  top: '-8px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '15px',
  height: '15px',
  background: '#3b82f6',
  border: '2px solid white',
  borderRadius: '50%',
  zIndex: 9999,
  pointerEvents: 'all' as const,
  cursor: 'crosshair',
};

const handleStyleBottom = {
  position: 'absolute' as const,
  bottom: '-8px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '15px',
  height: '15px',
  background: '#3b82f6',
  border: '2px solid white',
  borderRadius: '50%',
  zIndex: 9999,
  pointerEvents: 'all' as const,
  cursor: 'crosshair',
};

/**
 * Unified MessageNode component that handles all LOD levels internally.
 * DEFINITIVE FIX: Handles properly centered and edges always visible in ALL LOD levels
 */
const UnifiedMessageNode = memo(
  (props: NodeProps<MessageNodeData>) => {
    const { data, id, selected } = props;
    const lodLevel = data?.lodLevel ?? LOD_LEVELS.FULL;
    const previousLodRef = useRef(lodLevel);

    // Track LOD changes for debugging
    useEffect(() => {
      if (previousLodRef.current !== lodLevel) {
        console.log(
          `[UnifiedMessageNode] LOD changed for ${id}: ${previousLodRef.current} -> ${lodLevel}`,
        );
        previousLodRef.current = lodLevel;
      }
    }, [lodLevel, id]);

    // Prepare data for Compact and Mini nodes with proper type mapping
    const compactData = {
      messageType: data?.type ?? data?.messageType ?? 'system',
      message: data?.message ?? '',
      label: data?.label ?? data?.title ?? 'Message',
    };

    const miniData = {
      messageType: data?.type ?? data?.messageType ?? 'system',
    };

    // Determine which component to render based on LOD
    let nodeContent = null;

    if (lodLevel === LOD_LEVELS.FULL) {
      nodeContent = <MessageNodeFull {...props} />;
    } else if (lodLevel === LOD_LEVELS.COMPACT) {
      nodeContent = <CompactMessageNode data={compactData} selected={selected} />;
    } else if (lodLevel === LOD_LEVELS.MINI) {
      nodeContent = <MiniMessageNode data={miniData} selected={selected} />;
    } else {
      // Fallback to FULL if LOD is undefined or unknown
      nodeContent = <MessageNodeFull {...props} />;
    }

    return (
      <div
        className='unified-message-node'
        data-node-id={id}
        data-lod={lodLevel}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* TOP HANDLE - ALWAYS VISIBLE AND CENTERED */}
        <Handle
          type='target'
          position={Position.Top}
          id='input'
          isConnectable
          style={handleStyleTop}
          aria-label='Punto de conexión de entrada'
        />

        {/* NODE CONTENT - Changes based on LOD */}
        {nodeContent}

        {/* BOTTOM HANDLE - ALWAYS VISIBLE AND CENTERED */}
        <Handle
          type='source'
          position={Position.Bottom}
          id='output'
          isConnectable
          style={handleStyleBottom}
          aria-label='Punto de conexión de salida'
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // CRITICAL: Allow re-render on LOD changes
    const prevData = prevProps.data ?? {};
    const nextData = nextProps.data ?? {};

    // Force re-render if LOD changes
    if (prevData.lodLevel !== nextData.lodLevel) {
      console.log(
        `[UnifiedMessageNode] Forcing re-render for LOD change: ${prevData.lodLevel} -> ${nextData.lodLevel}`,
      );
      return false;
    }

    // Also force re-render if selection changes (for visual feedback)
    if (prevProps.selected !== nextProps.selected) {
      return false;
    }

    // Skip render only if nothing important changed
    return (
      prevProps.id === nextProps.id &&
      prevData.label === nextData.label &&
      prevData.message === nextData.message &&
      prevData.type === nextData.type &&
      prevData.messageType === nextData.messageType &&
      JSON.stringify(prevData.variables) === JSON.stringify(nextData.variables) &&
      prevProps.dragging === nextProps.dragging &&
      prevProps.isConnectable === nextProps.isConnectable
    );
  },
);

UnifiedMessageNode.displayName = 'UnifiedMessageNode';

export default UnifiedMessageNode;

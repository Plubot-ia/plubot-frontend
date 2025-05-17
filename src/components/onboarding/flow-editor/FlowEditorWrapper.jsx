import React, { useMemo, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { FlowEditorProvider } from '@/contexts/FlowEditorContext';
import { NODE_TYPES, EDGE_TYPES } from '@/utils/nodeConfig';
import UltraOptimizedNode from './ui/UltraOptimizedNode';
import UltraOptimizedEdge from './ui/UltraOptimizedEdge';
import { applyPerformancePatches } from './PerformancePatch';

/**
 * Componente de envoltura para el editor de flujos
 * Maneja la configuración inicial, proveedores de contexto y optimizaciones
 */
const FlowEditorWrapper = ({
  children,
  initialNodes = [],
  initialEdges = [],
  onSave,
  onError,
  onLoad,
  ...props
}) => {
  // Aplicar parches de rendimiento al montar
  useEffect(() => {
    applyPerformancePatches();
    
    // Limpiar al desmontar
    return () => {
      // Cualquier limpieza necesaria
    };
  }, []);

  // Tipos de nodos optimizados
  const nodeTypes = useMemo(() => ({
    [NODE_TYPES.start]: UltraOptimizedNode,
    [NODE_TYPES.end]: UltraOptimizedNode,
    [NODE_TYPES.message]: UltraOptimizedNode,
    [NODE_TYPES.decision]: UltraOptimizedNode,
    [NODE_TYPES.action]: UltraOptimizedNode,
    [NODE_TYPES.option]: UltraOptimizedNode,
    [NODE_TYPES.HTTP_REQUEST_NODE]: UltraOptimizedNode,
    [NODE_TYPES.WEBHOOK_NODE]: UltraOptimizedNode,
    [NODE_TYPES.DATABASE_NODE]: UltraOptimizedNode,
    [NODE_TYPES.AI_NODE]: UltraOptimizedNode,
    [NODE_TYPES.NLP_NODE]: UltraOptimizedNode,
    [NODE_TYPES.COMPLEX_CONDITION_NODE]: UltraOptimizedNode,
    [NODE_TYPES.POWER_NODE]: UltraOptimizedNode,
    [NODE_TYPES.ULTRA_OPTIMIZED_NODE]: UltraOptimizedNode,
  }), []);

  // Tipos de aristas optimizadas
  const edgeTypes = useMemo(() => ({
    [EDGE_TYPES.default]: UltraOptimizedEdge,
    [EDGE_TYPES.success]: UltraOptimizedEdge,
    [EDGE_TYPES.warning]: UltraOptimizedEdge,
    [EDGE_TYPES.danger]: UltraOptimizedEdge,
    [EDGE_TYPES.ULTRA_OPTIMIZED_EDGE]: UltraOptimizedEdge,
  }), []);

  // Configuración inicial del editor
  const initialConfig = useMemo(() => ({
    nodes: initialNodes,
    edges: initialEdges,
    viewport: { x: 0, y: 0, zoom: 1 },
    onSave,
    onError,
    onLoad,
  }), [initialNodes, initialEdges, onSave, onError, onLoad]);

  return (
    <ReactFlowProvider>
      <FlowEditorProvider initialConfig={initialConfig}>
        {React.cloneElement(children, {
          nodeTypes,
          edgeTypes,
          ...props,
        })}
      </FlowEditorProvider>
    </ReactFlowProvider>
  );
};

export default React.memo(FlowEditorWrapper);

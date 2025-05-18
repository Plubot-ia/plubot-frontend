// Exportar componentes principales
export { default as FlowEditor } from './FlowEditor';
export { default as FlowEditorWrapper } from './FlowEditorWrapper';

// Exportar componentes de UI
export { default as UltraOptimizedNode } from './ui/UltraOptimizedNode';
export { default as UltraOptimizedEdge } from './ui/UltraOptimizedEdge';

// Exportar hooks
export { default as useFlowOptimization } from '@/hooks/useFlowOptimization';

// Exportar utilidades
export * from './utils/flowEditorUtils';

// Exportar configuraciones
export * from '@/utils/nodeConfig';

// Exportar contextos
export { FlowEditorProvider, useFlowEditor } from '@/contexts/FlowEditorContext';

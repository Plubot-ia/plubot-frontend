// Exportar componentes principales
export { default as FlowEditor } from './FlowEditor';
// FlowEditorWrapper eliminado - componente redundante

// Exportar componentes de UI
export { default as UltraOptimizedNode } from './ui/UltraOptimizedNode';
export { default as UltraOptimizedEdge } from './ui/UltraOptimizedEdge';

// Exportar utilidades
export * from './utils/flowEditorUtilities';

// Exportar configuraciones
export * from '@/utils/node-config.js';

// Exportar contextos
export { FlowEditorProvider } from '@/contexts/FlowEditorContext';
export { default as useFlowEditor } from '@/hooks/useFlowEditor';

// src/hooks/useFlowValidation.ts
// STUB: Implementación completa requerida

export interface FlowValidationError {
  nodeId: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface UseFlowValidationReturn {
  flowErrors: FlowValidationError[];
  validateFlow: () => Promise<FlowValidationError[]>;
  getNodeErrors: (nodeId: string) => FlowValidationError[];
}

export const useFlowValidation = (): UseFlowValidationReturn => {
  console.warn('useFlowValidation hook is a stub and needs full implementation.');
  return {
    flowErrors: [],
    validateFlow: async () => {
      console.log('useFlowValidation stub: validateFlow called');
      return [];
    },
    getNodeErrors: (nodeId: string) => {
      console.log(`useFlowValidation stub: getNodeErrors called for ${nodeId}`);
      return [];
    },
  };
};

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

  return {
    flowErrors: [],
    validateFlow: async () => {

      return [];
    },
    getNodeErrors: (nodeId: string) => {

      return [];
    },
  };
};

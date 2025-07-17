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
  getNodeErrors: () => FlowValidationError[];
}

export const useFlowValidation = (): UseFlowValidationReturn => {
  return {
    flowErrors: [],
    validateFlow: async () => {
      // STUB: Futura implementación asíncrona. Se retorna una promesa para mantener la firma.
      return Promise.resolve([]);
    },
    getNodeErrors: () => {
      // STUB: El parámetro no se utiliza en la implementación actual.
      return [];
    },
  };
};

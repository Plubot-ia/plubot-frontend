// src/hooks/useFlowValidation.ts
// Hook completo para validación de flujos y nodos

import { useMemo, useCallback } from 'react';
import { useReactFlow, type Node, type Edge } from 'reactflow';

import useFlowStore from '@/stores/use-flow-store';
import { validateRequiredNodes } from '@/utils/node-validators';

// Tipos para los datos de nodos
interface NodeData {
  label?: string;
  question?: string;
  conditions?: unknown[];
  prompt?: string;
  message?: string;
  url?: string;
  channelId?: string;
  messageContent?: string;
}

interface FlowNode extends Node {
  data: NodeData;
}

export interface FlowValidationError {
  nodeId: string;
  message: string;
  severity: 'error' | 'warning';
  type: 'connection' | 'configuration' | 'structure';
}

export interface UseFlowValidationReturn {
  flowErrors: FlowValidationError[];
  validateFlow: () => Promise<FlowValidationError[]>;
  getNodeErrors: (nodeId?: string) => FlowValidationError[];
  isFlowValid: boolean;
  hasWarnings: boolean;
}

/**
 * Hook para validación completa de flujos y nodos
 * Integra validaciones de estructura, conexiones y configuración
 */
export const useFlowValidation = (): UseFlowValidationReturn => {
  const { getNodes, getEdges } = useReactFlow();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const nodes = useFlowStore((state) => state.nodes as FlowNode[]);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const edges = useFlowStore((state) => state.edges as Edge[]);

  // Validaciones de estructura del flujo
  const validateFlowStructure = useCallback(
    (nodesToValidate: FlowNode[], edgesToValidate: Edge[]): FlowValidationError[] => {
      const errors: FlowValidationError[] = [];

      // Validar nodos requeridos (inicio y fin)
      const requiredNodesValidation = validateRequiredNodes(nodesToValidate);
      if (!requiredNodesValidation.valid) {
        errors.push({
          nodeId: 'flow',
          message: requiredNodesValidation.message ?? 'Error de validación de estructura',
          severity: 'error',
          type: 'structure',
        });
      }

      // Validar nodos huérfanos (sin conexiones)
      nodesToValidate.forEach((node) => {
        if (node.type !== 'start' && node.type !== 'end') {
          const hasIncoming = edgesToValidate.some((edge) => edge.target === node.id);
          const hasOutgoing = edgesToValidate.some((edge) => edge.source === node.id);

          if (!hasIncoming && !hasOutgoing) {
            errors.push({
              nodeId: node.id,
              message: `El nodo "${node.data?.label ?? node.type ?? 'desconocido'}" no tiene conexiones`,
              severity: 'warning',
              type: 'connection',
            });
          }
        }
      });

      return errors;
    },
    [],
  );

  // Validaciones de configuración de nodos
  const validateNodeConfiguration = useCallback(
    (nodesToValidate: FlowNode[]): FlowValidationError[] => {
      const errors: FlowValidationError[] = [];

      nodesToValidate.forEach((node) => {
        switch (node.type) {
          case 'decision':
            if (!node.data?.question || node.data.question.trim().length === 0) {
              errors.push({
                nodeId: node.id,
                message: 'El nodo de decisión requiere una pregunta',
                severity: 'error',
                type: 'configuration',
              });
            }
            if (!node.data?.conditions || node.data.conditions.length === 0) {
              errors.push({
                nodeId: node.id,
                message: 'El nodo de decisión requiere al menos una condición',
                severity: 'error',
                type: 'configuration',
              });
            }
            break;

          case 'aiNode':
          case 'aiNodePro':
            if (!node.data?.prompt || node.data.prompt.trim().length === 0) {
              errors.push({
                nodeId: node.id,
                message: 'El nodo de IA requiere un prompt',
                severity: 'error',
                type: 'configuration',
              });
            }
            break;

          case 'message':
            if (!node.data?.message || node.data.message.trim().length === 0) {
              errors.push({
                nodeId: node.id,
                message: 'El nodo de mensaje requiere contenido',
                severity: 'error',
                type: 'configuration',
              });
            }
            break;

          case 'httpRequest':
            if (!node.data?.url || node.data.url.trim().length === 0) {
              errors.push({
                nodeId: node.id,
                message: 'El nodo HTTP requiere una URL',
                severity: 'error',
                type: 'configuration',
              });
            }
            break;

          case 'discord':
            if (!node.data?.channelId || !node.data?.messageContent) {
              errors.push({
                nodeId: node.id,
                message: 'El nodo Discord requiere canal y mensaje',
                severity: 'error',
                type: 'configuration',
              });
            }
            break;

          case undefined:
            // Nodo sin tipo definido
            errors.push({
              nodeId: node.id,
              message: 'El nodo no tiene un tipo definido',
              severity: 'error',
              type: 'configuration',
            });
            break;

          default:
            // No hay validaciones específicas para otros tipos de nodos
            break;
        }
      });

      return errors;
    },
    [],
  );

  // Calcular errores del flujo
  const flowErrors = useMemo(() => {
    const currentNodes = (getNodes?.() as FlowNode[]) || nodes;
    const currentEdges = (getEdges?.() as Edge[]) || edges;

    const structureErrors = validateFlowStructure(currentNodes, currentEdges);
    const configurationErrors = validateNodeConfiguration(currentNodes);

    return [...structureErrors, ...configurationErrors];
  }, [nodes, edges, getNodes, getEdges, validateFlowStructure, validateNodeConfiguration]);

  // Validación completa del flujo
  const validateFlow = useCallback(async (): Promise<FlowValidationError[]> => {
    // Simular validación asíncrona (para futuras integraciones con backend)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(flowErrors);
      }, 100);
    });
  }, [flowErrors]);

  // Obtener errores de un nodo específico
  const getNodeErrors = useCallback(
    (nodeId?: string): FlowValidationError[] => {
      if (!nodeId) {
        return flowErrors;
      }
      return flowErrors.filter((error) => error.nodeId === nodeId);
    },
    [flowErrors],
  );

  // Estados derivados
  const isFlowValid = useMemo(() => {
    return !flowErrors.some((error) => error.severity === 'error');
  }, [flowErrors]);

  const hasWarnings = useMemo(() => {
    return flowErrors.some((error) => error.severity === 'warning');
  }, [flowErrors]);

  return {
    flowErrors,
    validateFlow,
    getNodeErrors,
    isFlowValid,
    hasWarnings,
  };
};

import { debounce } from 'lodash';
import { useState, useCallback, useMemo } from 'react';

import useFlowStore from '@/stores/use-flow-store';

import type { AiNodeProData } from './types';
import { AiNodeProDataSchema } from './types';

// Definir la forma del estado del store para proporcionar tipos a TypeScript
interface FlowStoreState {
  updateNode: (id: string, data: Partial<AiNodeProData>) => void;
  nodes: { id: string; data: Partial<AiNodeProData> }[];
  isUltraMode: boolean;
  getState: () => FlowStoreState;
}

interface UseAiNodeProProperties {
  id: string;
  data: AiNodeProData;
}

export interface UseAiNodeProReturn {
  prompt: string;
  temperature: number;
  maxTokens: number;
  isCollapsed: boolean;
  isLoading: boolean;
  error: string | null;
  lastResponse: string | undefined;
  lastPrompt: string | undefined;
  ultraMode: boolean;
  handlePromptChange: (newPrompt: string) => void;
  handleSettingChange: <K extends keyof AiNodeProData>(
    field: K,
    value: AiNodeProData[K],
  ) => void;
  handleToggleCollapse: () => void;
  handleExecute: () => Promise<void>;
}

export const useAiNodePro = ({
  id,
  data,
}: UseAiNodeProProperties): UseAiNodeProReturn => {
  const { updateNode } = useFlowStore() as unknown as {
    updateNode: FlowStoreState['updateNode'];
  };

  // Validar y usar datos por defecto del schema si es necesario
  const validatedData = AiNodeProDataSchema.parse(data ?? {});

  // Initialize prompt state from `promptTemplate` or fallback to `prompt`
  const [prompt, setPrompt] = useState(
    validatedData.promptTemplate || validatedData.prompt || '',
  );
  const [temperature, setTemperature] = useState(validatedData.temperature);
  const [maxTokens, setMaxTokens] = useState(validatedData.maxTokens);
  const [isCollapsed, setIsCollapsed] = useState(validatedData.isCollapsed);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedUpdateNode = useMemo(
    () =>
      debounce((updatedData: Partial<AiNodeProData>) => {
        // [FIX] Get the latest node data directly from the store to avoid stale closure
        const { nodes } = (useFlowStore.getState as () => FlowStoreState)();
        const currentNode = nodes.find((n) => n.id === id);
        if (currentNode) {
          updateNode(id, { ...currentNode.data, ...updatedData });
        }
      }, 300),
    [id, updateNode], // `data` is removed from dependencies to prevent re-creation on every change
  );

  const handlePromptChange = useCallback(
    (newPrompt: string) => {
      setPrompt(newPrompt);
      // [FIX] Save to `promptTemplate` for the simulation and `prompt` for display/compatibility
      debouncedUpdateNode({ promptTemplate: newPrompt, prompt: newPrompt });
    },
    [debouncedUpdateNode],
  );

  const handleSettingChange = useCallback(
    <K extends keyof AiNodeProData>(field: K, value: AiNodeProData[K]) => {
      if (field === 'temperature') setTemperature(value as number);
      if (field === 'maxTokens') setMaxTokens(value as number);
      debouncedUpdateNode({ [field]: value });
    },
    [debouncedUpdateNode],
  );

  const handleToggleCollapse = useCallback(() => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    updateNode(id, { ...data, isCollapsed: newCollapsedState });
  }, [isCollapsed, id, data, updateNode]);

  const handleExecute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulación de llamada a API

      await new Promise((resolve) => setTimeout(resolve, 1500));
      const response = `Respuesta simulada para el prompt: "${prompt.slice(0, 30)}..."`;

      // Actualizar el nodo con la respuesta y el último prompt ejecutado
      updateNode(id, {
        ...data,
        lastResponse: response,
        lastPrompt: prompt,
      });
    } catch (error_) {
      const errorMessage =
        error_ instanceof Error
          ? error_.message
          : 'Ocurrió un error desconocido.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [id, data, prompt, temperature, maxTokens, updateNode]);

  return {
    prompt,
    temperature,
    maxTokens,
    isCollapsed,
    isLoading,
    error,
    lastResponse: data.lastResponse,
    lastPrompt: data.lastPrompt,
    ultraMode:
      data.ultraMode ??
      (useFlowStore.getState as () => FlowStoreState)().isUltraMode,
    handlePromptChange,
    handleSettingChange,
    handleToggleCollapse,
    handleExecute,
  };
};

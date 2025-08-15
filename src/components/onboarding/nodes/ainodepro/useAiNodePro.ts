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
  handleSettingChange: <K extends keyof AiNodeProData>(field: K, value: AiNodeProData[K]) => void;
  handleToggleCollapse: () => void;
  handleExecute: () => Promise<void>;
}

export const useAiNodePro = ({ id, data }: UseAiNodeProProperties): UseAiNodeProReturn => {
  const { updateNode } = useFlowStore() as unknown as {
    updateNode: FlowStoreState['updateNode'];
  };

  // Validar y usar datos por defecto del schema si es necesario
  const validatedData = AiNodeProDataSchema.parse(data ?? {});

  // Initialize prompt state from `promptTemplate` or fallback to `prompt`
  const [prompt, setPrompt] = useState(validatedData.promptTemplate ?? validatedData.prompt ?? '');
  const [temperature, setTemperature] = useState(validatedData.temperature);
  const [maxTokens, setMaxTokens] = useState(validatedData.maxTokens);
  const [isCollapsed, setIsCollapsed] = useState(validatedData.isCollapsed);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | undefined>(validatedData.lastResponse);
  const [lastPrompt, setLastPrompt] = useState<string | undefined>(validatedData.lastPrompt);

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

      // Update store immediately for simulation access
      updateNode(id, {
        ...data,
        promptTemplate: newPrompt,
        prompt: newPrompt,
      });
    },
    [id, data, updateNode],
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
      const trimmedPrompt = prompt.trim();

      if (!trimmedPrompt) {
        return;
      }

      const apiUrl = `${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5000/api'}/ai-node`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          temperature,
          max_tokens: maxTokens,
          system_message: '',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as { response?: string; message?: string };
      const aiResponse = result.response ?? result.message ?? 'Sin respuesta';

      // Update local state immediately for UI feedback
      setLastResponse(aiResponse);
      setLastPrompt(trimmedPrompt);

      // Update store with response data
      updateNode(id, {
        ...data,
        promptTemplate: trimmedPrompt,
        prompt: trimmedPrompt,
        lastResponse: aiResponse,
        lastPrompt: trimmedPrompt,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error executing AI Node Pro:', errorMessage);
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
    lastResponse, // Usar estado local para re-renderizado inmediato
    lastPrompt, // Usar estado local para re-renderizado inmediato
    ultraMode: data.ultraMode ?? (useFlowStore.getState as () => FlowStoreState)().isUltraMode,
    handlePromptChange,
    handleSettingChange,
    handleToggleCollapse,
    handleExecute,
  };
};

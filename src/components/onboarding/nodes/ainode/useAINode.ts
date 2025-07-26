/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface ImportMeta {
    env: {
      [key: string]: any;
      VITE_API_URL?: string;
    };
  }
}

import { useCallback } from 'react';

import useFlowStore from '@/stores/use-flow-store';

import type { AiNodeData } from './types'; // Asegúrate que la ruta a types.ts sea correcta

// Props que el hook espera, usualmente pasadas desde el componente AiNode
export interface UseAINodeProperties {
  id: string;
  data: AiNodeData;
}

// Interfaz para la respuesta esperada de la API de Grok
interface GrokApiResponse {
  response?: string;
}

// Función para realizar la llamada al backend que interactúa con la API de Grok
const callGrokApi = async (
  prompt: string,
  temperature: number,
  maxTokens: number,
  systemMessage?: string,
): Promise<string> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
    if (!apiUrl) {
      throw new Error('La URL de la API no está configurada');
    }
    const response = await fetch(`${apiUrl}/ai-node`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        temperature,
        maxTokens,
        systemMessage,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Error en la llamada al backend: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as GrokApiResponse;
    return data.response ?? 'Respuesta vacía del backend';
  } catch (error) {
    throw error;
  }
};

export const useAINode = ({ id, data }: UseAINodeProperties) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access -- Zustand store usage in mixed JS/TS codebase
  const updateNode = useFlowStore((state) => state.updateNode);

  // Función genérica para actualizar cualquier parte de node.data
  const updateNodeData = useCallback(
    (newData: Partial<AiNodeData>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Zustand store call in mixed JS/TS codebase
      updateNode(id, newData);
    },
    [id, updateNode],
  );

  // Manejador para cambios en el promptTemplate
  const handlePromptChange = useCallback(
    (newPrompt: string) => {
      // Aquí iría la lógica de interpolación de variables para interpolatedPromptPreview
      // Por ahora, lo mantenemos simple:
      updateNodeData({
        promptTemplate: newPrompt,
        // TODO: Implementar interpolación real para la vista previa
        interpolatedPromptPreview: `Vista previa interpolada para: ${newPrompt.slice(0, 30)}...`,
      });
    },
    [updateNodeData],
  );

  // Manejador para el estado de expansión/contracción del nodo
  const handleToggleCollapse = useCallback(() => {
    updateNodeData({ isCollapsed: !data.isCollapsed });
  }, [updateNodeData, data.isCollapsed]);

  // Manejador genérico para cambios en otros settings del nodo
  const handleSettingChange = useCallback(
    (settingKey: keyof AiNodeData, value: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Dynamic object key assignment from controlled settingKey parameter
      updateNodeData({ [settingKey]: value });
    },
    [updateNodeData],
  );

  // Manejador para ejecutar la lógica del nodo IA
  const handleExecute = useCallback(async () => {
    updateNodeData({ isLoading: true, error: null, lastResponse: null });
    try {
      // TODO: Implementar la interpolación real del prompt usando variables del contexto del flujo
      const promptToExecute = data.promptTemplate; // Usar el prompt interpolado real en el futuro

      if (!promptToExecute && !data.systemMessage) {
        updateNodeData({
          isLoading: false,
          error:
            'El prompt y el mensaje de sistema están vacíos. No se puede ejecutar.',
          lastResponse: null,
        });
        return;
      }

      const response = await callGrokApi(
        promptToExecute,
        data.temperature,
        data.maxTokens,
        data.systemMessage,
      );
      updateNodeData({ isLoading: false, lastResponse: response, error: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error desconocido durante la ejecución.';
      updateNodeData({
        isLoading: false,
        error: errorMessage,
        lastResponse: null,
      });
    }
  }, [data, updateNodeData]);

  // Devolvemos los estados y manejadores que AiNode.tsx utilizará
  return {
    // Directamente desde data para que AiNode.tsx los consuma
    promptTemplate: data.promptTemplate,
    temperature: data.temperature,
    maxTokens: data.maxTokens,
    systemMessage: data.systemMessage,
    responseVariable: data.responseVariable,
    streaming: data.streaming,
    ultraMode: data.ultraMode,
    isLoading: data.isLoading,
    error: data.error,
    lastResponse: data.lastResponse,
    interpolatedPromptPreview: data.interpolatedPromptPreview,
    isCollapsed: data.isCollapsed ?? false, // Valor por defecto si no está definido
    handlePromptChange,
    handleSettingChange,
    handleExecute,
    handleToggleCollapse,
    updateNodeData, // Exponer para flexibilidad, si es necesario
  };
};

// src/components/onboarding/nodes/ainode/types.ts
export interface AiNodeData {
  id: string; // Aunque el ID del nodo ya viene de React Flow, puede ser útil tenerlo en data si se duplica/serializa
  type: 'ai'; // Tipo específico del nodo
  label: string; // Nombre editable del nodo, e.g., "Generador de Contenido IA"
  promptTemplate: string; // Plantilla del prompt con variables {{variable}}
  temperature: number; // 0.0 a 1.0 (o 2.0 según API)
  maxTokens: number; // Máximo de tokens en la respuesta
  systemMessage?: string; // Mensaje de sistema para guiar a la IA
  responseVariable: string; // Nombre de la variable donde se guardará la respuesta para nodos siguientes
  streaming: boolean; // Si la respuesta debe ser en stream (opcional avanzado)

  // Estado interno del nodo (no necesariamente parte de la configuración persistente, pero útil para el UI)
  isLoading?: boolean;
  error?: string | null;
  lastResponse?: string | null;
  interpolatedPromptPreview?: string; // Vista previa del prompt con variables reemplazadas

  // Configuración de UI/UX
  ultraMode?: boolean; // true = sin animación
  isCollapsed?: boolean; // Estado de expansión del nodo
  lodLevel?: string; // Nivel de detalle inyectado por el Flow
}

// Podríamos añadir más tipos relacionados con la IA aquí en el futuro

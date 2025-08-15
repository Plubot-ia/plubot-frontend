import { z } from 'zod';

// Schema de validación con Zod para los datos del nodo AiNodePro
export const AiNodeProDataSchema = z.object({
  label: z.string().min(1, 'El título no puede estar vacío.').default('Nodo IA Pro'),
  prompt: z.string().default(''),
  promptTemplate: z.string().optional(),
  // Temperatura (Creatividad): 0.2 (Racional) a 1.0 (Creativo)
  temperature: z.number().min(0.2).max(1).default(0.6),
  // Max Tokens (Tamaño de respuesta): 50 (Breve), 200 (Medio), 500 (Largo)
  maxTokens: z.number().min(50).max(500).default(200),
  responseVariable: z.string().default('ai_response'),
  isCollapsed: z.boolean().default(false),
  lastResponse: z.string().optional(),
  lastPrompt: z.string().optional(),
  ultraMode: z.boolean().default(false),
});

// Tipo inferido de Zod para usar en TypeScript
export type AiNodeProData = z.infer<typeof AiNodeProDataSchema>;

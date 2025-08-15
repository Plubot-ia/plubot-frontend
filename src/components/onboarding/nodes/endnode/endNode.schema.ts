import { z } from 'zod';

export const END_NODE_ZOD_SCHEMA = z.object({
  label: z.string().max(100).optional().default('Fin'),
  highlight: z.boolean().optional().default(false),
  dynamicContent: z.string().optional().default('Este es el final del flujo.'),
  lastRun: z.string().optional().default(new Date().toLocaleDateString()),
});

export type EndNodeData = z.infer<typeof END_NODE_ZOD_SCHEMA>;

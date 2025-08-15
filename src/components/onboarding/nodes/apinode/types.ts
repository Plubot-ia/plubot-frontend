/**
 * @file types.ts
 * @description Tipos TypeScript para el ApiNode
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiNodeData {
  url?: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: string;
  guardarEnVariable?: string;
  timeout?: number;
  retryCount?: number;
  description?: string;
  showAdvancedOptions?: boolean;
  authentication?: {
    type?: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
}

export interface ApiNodeProps {
  id: string;
  data: ApiNodeData;
  selected?: boolean;
  isConnectable?: boolean;
}

export interface ApiResponse {
  data?: unknown;
  status?: number;
  headers?: Record<string, string>;
  error?: string;
}

export interface ApiNodeConfigProps {
  data: ApiNodeData;
  onUpdate: (data: Partial<ApiNodeData>) => void;
  onClose: () => void;
}

export interface HttpMethodOption {
  value: HttpMethod;
  label: string;
  color: string;
  icon: string;
}

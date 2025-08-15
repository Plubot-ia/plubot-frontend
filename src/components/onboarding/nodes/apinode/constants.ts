/**
 * @file constants.ts
 * @description Constantes para el ApiNode
 */

import type { HttpMethodOption } from './types';

export const HTTP_METHODS: HttpMethodOption[] = [
  {
    value: 'GET',
    label: 'Obtener datos',
    color: '#10B981',
    icon: '📥',
  },
  {
    value: 'POST',
    label: 'Enviar datos',
    color: '#3B82F6',
    icon: '📤',
  },
  {
    value: 'PUT',
    label: 'Actualizar',
    color: '#F59E0B',
    icon: '✏️',
  },
  {
    value: 'DELETE',
    label: 'Eliminar',
    color: '#EF4444',
    icon: '🗑️',
  },
  {
    value: 'PATCH',
    label: 'Modificar',
    color: '#8B5CF6',
    icon: '🔧',
  },
];

export const COMMON_HEADERS = [
  { label: 'Content-Type: JSON', value: 'Content-Type', content: 'application/json' },
  {
    label: 'Content-Type: Form',
    value: 'Content-Type',
    content: 'application/x-www-form-urlencoded',
  },
  { label: 'Accept: JSON', value: 'Accept', content: 'application/json' },
  { label: 'Authorization: Bearer', value: 'Authorization', content: 'Bearer TOKEN_HERE' },
];

export const API_EXAMPLES = [
  {
    label: '🌤️ Clima',
    url: 'https://api.openweathermap.org/data/2.5/weather?q=Madrid&appid=YOUR_API_KEY',
    method: 'GET' as const,
    description: 'Obtener el clima actual',
  },
  {
    label: '📝 JSONPlaceholder',
    url: 'https://jsonplaceholder.typicode.com/posts',
    method: 'GET' as const,
    description: 'API de prueba gratuita',
  },
  {
    label: '🎲 Número aleatorio',
    url: 'https://api.random.org/json-rpc/2/invoke',
    method: 'POST' as const,
    description: 'Generar números aleatorios',
  },
];

export const NODE_CONFIG = {
  COLORS: {
    PRIMARY: '#8B5CF6',
    SECONDARY: '#A78BFA',
    TEXT: '#FFFFFF',
    TEXT_LIGHT: '#E9D5FF',
    BACKGROUND: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    BORDER: '#7C3AED',
    HANDLE: '#10B981',
    HANDLE_BORDER: '#FFFFFF',
    SELECTED: '#A78BFA',
    ERROR: '#EF4444',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
  },
  SIZES: {
    MIN_WIDTH: 340,
    MIN_HEIGHT: 200,
    COLLAPSED_HEIGHT: 120,
  },
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
};

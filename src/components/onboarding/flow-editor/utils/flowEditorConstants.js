// Constantes utilizadas en el editor de flujos
import { EDGE_COLORS } from '@/utils/node-config.js';

// Estilos para ReactFlow
export const REACT_FLOW_STYLE = {
  background: 'transparent',
  height: '100%',
  width: '100%',
  imageRendering: 'high-quality',
  textRendering: 'optimizeLegibility',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
};

// Configuración de la cuadrícula para snap
export const SNAP_GRID = [15, 15];

// Teclas para eliminar elementos (ampliadas para mayor compatibilidad)
// Incluye opciones para diferentes idiomas y distribuciones de teclado
export const DELETE_KEYS = [
  'Delete', // Inglés estándar
  'Backspace', // Alternativa común
  'Suprimir', // Español
  'Del', // Abreviatura común
  'Remove', // Alternativa
];

// Estilo por defecto para aristas
export const DEFAULT_EDGE_STYLE = {
  stroke: EDGE_COLORS.default,
  strokeWidth: 2,
};

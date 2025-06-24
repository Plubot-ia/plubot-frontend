/**
 * flow-extents.js
 * Definiciones de límites para el canvas y los nodos en ReactFlow
 * Estas configuraciones son cruciales para el correcto posicionamiento y navegación
 */

// Definición del área donde los nodos pueden ser posicionados
// [x-min, y-min, x-max, y-max]
// Valores generosos para permitir un área de trabajo amplia
export const NODE_EXTENT = [
  -10000, // x mínimo (izquierda)
  -10000, // y mínimo (arriba)
  10000, // x máximo (derecha)
  10000, // y máximo (abajo)
];

// Definición del área donde el usuario puede navegar/panear el canvas
// [x-min, y-min, x-max, y-max]
// Valores generosos para permitir navegación amplia
export const TRANSLATE_EXTENT = [
  -20000, // x mínimo (izquierda)
  -20000, // y mínimo (arriba)
  20000, // x máximo (derecha)
  20000, // y máximo (abajo)
];

// Configuración para el zoom mínimo permitido
export const MIN_ZOOM = 0.1; // 10% del tamaño original

// Configuración para el zoom máximo permitido
export const MAX_ZOOM = 2.5; // 250% del tamaño original

// Configuración para el centro del viewport por defecto
export const DEFAULT_CENTER_POSITION = { x: 0, y: 0 };

// Configuración para la posición inicial del nodo de inicio
export const START_NODE_POSITION = { x: 250, y: 5 };

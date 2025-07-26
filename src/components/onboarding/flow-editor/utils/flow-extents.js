/**
 * flow-extents.js
 * Define los límites para el canvas de ReactFlow.
 * Estos valores previenen que los nodos se arrastren fuera de un área definida
 * y que el usuario haga zoom/paneo indefinidamente.
 *
 * @version 2.0.0
 */

// Límite para el área donde los nodos pueden ser arrastrados.
// Formato: [[x-min, y-min], [x-max, y-max]]
export const NODE_EXTENT = [
  [-10_000, -10_000],
  [10_000, 10_000],
];

// Límite para el área de paneo (movimiento del canvas).
export const TRANSLATE_EXTENT = [
  [-20_000, -20_000],
  [20_000, 20_000],
];

// Límites de zoom.
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 2.5;

// Configuración para el centro del viewport por defecto
export const DEFAULT_CENTER_POSITION = { x: 0, y: 0 };

// Configuración para la posición inicial del nodo de inicio
export const START_NODE_POSITION = { x: 250, y: 5 };

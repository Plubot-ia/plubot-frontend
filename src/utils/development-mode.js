/**
 * Utilidades para el modo de desarrollo
 * Permite que la aplicación funcione sin necesidad de conectarse al backend
 */

// Determinar si estamos en modo desarrollo
export const isDevelopment = import.meta.env.MODE === 'development';

// Determinar si debemos usar datos de ejemplo
export const useDevelopmentData =
  isDevelopment &&
  (import.meta.env.VITE_USE_DEV_DATA === 'true' || !import.meta.env.VITE_USE_DEV_DATA);

// Datos de ejemplo para el editor de flujos
export const SAMPLE_NODES = [
  {
    id: 'node-1',
    type: 'message',
    position: { x: 100, y: 100 },
    data: { label: 'Nodo 1', message: 'Este es el primer nodo' },
    width: 150,
    height: 150,
    draggable: true,
    zIndex: 1000,
  },
  {
    id: 'node-2',
    type: 'message',
    position: { x: 400, y: 100 },
    data: { label: 'Nodo 2', message: 'Este es el segundo nodo' },
    width: 150,
    height: 150,
    draggable: true,
    zIndex: 1000,
  },
  {
    id: 'node-3',
    type: 'message',
    position: { x: 700, y: 100 },
    data: { label: 'Nodo 3', message: 'Este es el tercer nodo' },
    width: 150,
    height: 150,
    draggable: true,
    zIndex: 1000,
  },
];

export const SAMPLE_EDGES = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    type: 'default',
    style: { stroke: '#00e0ff', strokeWidth: 2 },
  },
  {
    id: 'edge-2',
    source: 'node-2',
    target: 'node-3',
    type: 'default',
    style: { stroke: '#00e0ff', strokeWidth: 2 },
  },
];

// Función para generar nodos de ejemplo adicionales para probar el rendimiento
export const generateSampleNodes = (count = 40) => {
  const nodes = [...SAMPLE_NODES];
  const edges = [...SAMPLE_EDGES];

  // Generar nodos adicionales en una cuadrícula
  const columns = 5;
  const spacing = 300;

  for (let index = 3; index < count; index++) {
    const row = Math.floor(index / columns);
    const col = index % columns;

    const newNode = {
      id: `node-${index + 1}`,
      type: 'message',
      position: {
        x: 100 + col * spacing,
        y: 400 + row * spacing,
      },
      data: {
        label: `Nodo ${index + 1}`,
        message: `Este es el nodo ${index + 1}`,
      },
      width: 150,
      height: 150,
      draggable: true,
      zIndex: 1000,
    };

    nodes.push(newNode);

    // Conectar con el nodo anterior para crear una red
    if (index > 3) {
      const newEdge = {
        id: `edge-${index}`,
        source: `node-${index}`,
        target: `node-${index + 1}`,
        type: 'default',
        style: { stroke: '#00e0ff', strokeWidth: 2 },
      };

      edges.push(newEdge);
    }
  }

  return { nodes, edges };
};

// Función para simular la autenticación en modo desarrollo
export const mockAuthentication = () => {
  return {
    user: {
      id: 'dev-user',
      name: 'Usuario de Desarrollo',
      email: 'dev@example.com',
    },
    token: 'dev-token',
  };
};

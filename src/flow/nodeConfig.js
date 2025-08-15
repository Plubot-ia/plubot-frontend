export const NODE_CONFIG = {
  start: {
    label: 'Inicio',
    message: 'Bienvenido a la conversación',
  },
  message: {
    label: 'Mensaje',
    message: 'Escribe tu mensaje aquí',
  },
  decision: {
    label: 'Decisión',
    condition: 'Condición',
    options: [],
  },
  action: {
    label: 'Acción',
    actionType: 'custom',
    parameters: {},
  },
  end: {
    label: 'Fin',
    message: 'Fin de la conversación',
  },
};

export const PATTERN_TEMPLATES = {
  secuencia: {
    nodes: [
      { type: 'start', pos: { x: 0, y: 0 }, data: { label: 'Inicio' } },
      {
        type: 'message',
        pos: { x: 250, y: 0 },
        data: { label: 'Mensaje', message: 'Escribe tu mensaje aquí' },
      },
      { type: 'end', pos: { x: 500, y: 0 }, data: { label: 'Fin' } },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
    ],
  },
  decision: {
    nodes: [
      { type: 'start', pos: { x: 0, y: 0 }, data: { label: 'Inicio' } },
      {
        type: 'message',
        pos: { x: 250, y: 0 },
        data: { label: 'Pregunta', message: '¿Estás de acuerdo?' },
      },
      {
        type: 'decision',
        pos: { x: 500, y: 0 },
        data: { label: 'Decisión', options: ['Sí', 'No'] },
      },
      {
        type: 'message',
        pos: { x: 750, y: -100 },
        data: { label: 'Respuesta Sí', message: '¡Excelente!' },
      },
      {
        type: 'message',
        pos: { x: 750, y: 100 },
        data: {
          label: 'Respuesta No',
          message: 'Entendido, no hay problema.',
        },
      },
      { type: 'end', pos: { x: 1000, y: 0 }, data: { label: 'Fin' } },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3, handle: 'yes', data: { label: 'Sí' } },
      { from: 2, to: 4, handle: 'no', data: { label: 'No' } },
      { from: 3, to: 5 },
      { from: 4, to: 5 },
    ],
  },
};

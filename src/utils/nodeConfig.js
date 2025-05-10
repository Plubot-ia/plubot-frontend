// nodeConfig.js
export const NODE_TYPES = {
    start: 'start',
    end: 'end',
    message: 'message',
    decision: 'decision',
    action: 'action',
    option: 'option',
  };
  
  export const EDGE_TYPES = {
    default: 'default',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
  };
  
  export const ACTION_TYPES = [
    { value: 'sendEmail', label: 'Enviar Correo', icon: '📧' },
    { value: 'saveData', label: 'Guardar Datos', icon: '💾' },
    { value: 'sendNotification', label: 'Enviar Notificación', icon: '🔔' },
    { value: 'apiCall', label: 'Llamada API', icon: '🌐' },
    { value: 'transformData', label: 'Transformar Datos', icon: '🔄' },
    { value: 'conditional', label: 'Condicional', icon: '⚙️' },
    { value: 'delay', label: 'Retraso', icon: '⏱️' },
    { value: 'webhook', label: 'Webhook', icon: '🔗' },
  ];
  
  export const CONDITION_TYPES = [
    'Contiene',
    'Igual a',
    'Mayor que',
    'Menor que',
    'Es nulo',
    'No contiene',
  ];
  
  export const NODE_DEFAULT_SIZES = {
    start: { width: 80, height: 40 },
    end: { width: 120, height: 80 },
    message: { width: 180, height: 80 },
    decision: { width: 180, height: 110 },
    action: { width: 240, height: 140 },
    option: { width: 150, height: 80 },
  };
  
  export const EDGE_COLORS = {
    default: '#00e0ff',
    success: '#00ff9d',
    warning: '#ffb700',
    danger: '#ff2e5b',
  };
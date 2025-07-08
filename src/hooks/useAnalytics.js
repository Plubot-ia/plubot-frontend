// Las funciones se mueven fuera del hook para evitar su redeclaración en cada render.
const trackNodeEdit = (_nodeId, _type, _data) => {
  // Aquí iría la integración con tu herramienta de analítica (por ejemplo, Mixpanel)
};

const trackNodeConnected = (_nodeId, _targetId, _option) => {
  // Aquí iría la integración con tu herramienta de analítica
};

const trackEvent = (_eventName, _eventData) => {
  // Aquí iría la integración con tu herramienta de analítica
};

export const useAnalytics = () => {
  return { trackNodeEdit, trackNodeConnected, trackEvent };
};

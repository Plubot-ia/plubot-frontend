export const useAnalytics = () => {
  const trackNodeEdit = (_nodeId, _type, _data) => {
    // Aquí iría la integración con tu herramienta de analítica (por ejemplo, Mixpanel)
  };

  const trackNodeConnected = (_nodeId, _targetId, _option) => {
    // Aquí iría la integración con tu herramienta de analítica
  };

  const trackEvent = (_eventName, _eventData) => {
    // Aquí iría la integración con tu herramienta de analítica
  };

  return { trackNodeEdit, trackNodeConnected, trackEvent };
};

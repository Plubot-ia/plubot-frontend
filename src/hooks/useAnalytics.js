export const useAnalytics = () => {
  const trackNodeEdit = (nodeId, type, data) => {
    // Aquí iría la integración con tu herramienta de analítica (por ejemplo, Mixpanel)
  };

  const trackNodeConnected = (nodeId, targetId, option) => {
    // Aquí iría la integración con tu herramienta de analítica
  };

  const trackEvent = (eventName, eventData) => {
    // Aquí iría la integración con tu herramienta de analítica
  };

  return { trackNodeEdit, trackNodeConnected, trackEvent };
};

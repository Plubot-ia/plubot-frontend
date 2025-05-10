export const useAnalytics = () => {
    const trackNodeEdit = (nodeId, type, data) => {
      console.log(`Tracking node edit: ${nodeId}`, { type, data });
      // Aquí iría la integración con tu herramienta de analítica (por ejemplo, Mixpanel)
    };
  
    const trackNodeConnected = (nodeId, targetId, option) => {
      console.log(`Tracking node connected: ${nodeId} -> ${targetId}`, { option });
      // Aquí iría la integración con tu herramienta de analítica
    };
  
    return { trackNodeEdit, trackNodeConnected };
  };
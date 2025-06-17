import React from 'react';
import CustomMiniMap from '../ui/CustomMiniMap';

/**
 * Wrapper para controlar la visualización del CustomMiniMap
 * Este componente garantiza que solo haya una instancia del mapa visible
 */
const MiniMapWrapper = ({ nodes, edges, isExpanded, isUltraMode, viewport, setByteMessage }) => {
  // Bandera global para controlar si el mapa ya se ha renderizado
  if (typeof window !== 'undefined' && !window._miniMapRendered) {
    window._miniMapRendered = true;
    
    return (
      <CustomMiniMap
        nodes={nodes}
        edges={edges}
        isExpanded={isExpanded}
        isUltraMode={isUltraMode}
        viewport={viewport}
        setByteMessage={setByteMessage}
      />
    );
  }
  
  return null;
};

export default MiniMapWrapper;

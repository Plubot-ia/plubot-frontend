import PropTypes from 'prop-types';
import React from 'react';

import CustomMiniMap from '../ui/CustomMiniMap';

/**
 * Wrapper para controlar la visualización del CustomMiniMap
 * Este componente garantiza que solo haya una instancia del mapa visible
 */
const MiniMapWrapper = ({
  nodes,
  edges,
  isExpanded,
  isUltraMode,
  viewport,
  setByteMessage,
}) => {
  // Bandera global para controlar si el mapa ya se ha renderizado
  if (globalThis.window !== undefined && !globalThis._miniMapRendered) {
    globalThis._miniMapRendered = true;

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
};

MiniMapWrapper.propTypes = {
  nodes: PropTypes.array.isRequired,
  edges: PropTypes.array.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  isUltraMode: PropTypes.bool.isRequired,
  viewport: PropTypes.object.isRequired,
  setByteMessage: PropTypes.func.isRequired,
};

export default MiniMapWrapper;

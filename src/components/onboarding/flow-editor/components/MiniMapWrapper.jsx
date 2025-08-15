import PropTypes from 'prop-types';
import { useEffect } from 'react';

import CustomMiniMap from '../ui/CustomMiniMap';

/**
 * Wrapper para controlar la visualización del CustomMiniMap
 * Este componente garantiza que solo haya una instancia del mapa visible
 */
const MiniMapWrapper = ({ nodes, edges, isExpanded, isUltraMode, viewport, setByteMessage }) => {
  // Efecto para gestionar la bandera global de forma segura y limpia.
  useEffect(() => {
    // Marcar como renderizado al montar el componente.
    globalThis._miniMapRendered = true;

    // Función de limpieza: se ejecuta al desmontar el componente.
    return () => {
      globalThis._miniMapRendered = false;
    };
  }, []); // El array vacío asegura que el efecto se ejecute solo una vez (al montar/desmontar).

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

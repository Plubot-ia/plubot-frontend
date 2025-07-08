import { EDGE_COLORS } from '@/utils/node-config.js';

/**
 * Componente para renderizar el marcador de fin de arista
 * Este componente es esencial para mostrar los puntos finales de las aristas
 */
const EdgeMarker = () => {
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        {Object.entries(EDGE_COLORS).map(([type, color]) => (
          <marker
            key={`${type}-marker`}
            id={`${type}-marker`}
            viewBox='0 0 12 12'
            refX='6'
            refY='6'
            markerWidth='8'
            markerHeight='8'
            orient='auto-start-reverse'
          >
            {/* Efecto de brillo exterior */}
            <circle
              cx='6'
              cy='6'
              r='5.5'
              fill='none'
              stroke={color}
              strokeOpacity='0.3'
              strokeWidth='1'
            />

            {/* Circulo principal */}
            <circle cx='6' cy='6' r='4' fill={color} />

            {/* Brillo interior */}
            <circle cx='6' cy='6' r='2' fill='white' fillOpacity='0.4' />
          </marker>
        ))}
      </defs>
    </svg>
  );
};

export default EdgeMarker;

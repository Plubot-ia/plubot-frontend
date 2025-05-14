import React from 'react';
import { EdgeText, getBezierPath, getSmoothStepPath } from 'reactflow';
import { EDGE_COLORS } from '@/utils/nodeConfig';

/**
 * Componente para renderizar aristas personalizadas
 */
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data }) => {
  // Obtener la ruta de la arista
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12, // Bordes más redondeados para un aspecto más suave
  });

  // Estilos base mejorados para todas las aristas
  const baseStyle = {
    strokeWidth: 2.5, // Línea más gruesa para mejor visibilidad
    stroke: 'rgba(0, 195, 255, 0.8)', // Color base cian más visible
    strokeDasharray: style.animated ? '5, 5' : 'none', // Línea punteada si es animada
    filter: 'drop-shadow(0 0 3px rgba(0, 195, 255, 0.5))', // Efecto de brillo sutil
    transition: 'stroke 0.3s, filter 0.3s', // Transiciones suaves
    ...style // Mantener estilos personalizados
  };

  return (
    <>
      {/* Eliminamos el efecto de brillo que causaba el sombreado negro */}
      <path
        id={id}
        style={baseStyle}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.label && (
        <EdgeText
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          label={data.label}
          labelStyle={{ fill: 'white', fontWeight: 700 }}
          labelBgStyle={{ fill: '#555' }}
          labelBgPadding={[2, 4]}
          labelBgBorderRadius={4}
        />
      )}
    </>
  );
};

/**
 * Componente para renderizar aristas con estilo de bezier
 */
const BezierEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data }) => {
  // Obtener la ruta de la arista
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.3, // Curvatura mejorada para un aspecto más fluido
  });

  // Estilos base mejorados para todas las aristas
  const baseStyle = {
    strokeWidth: 2.5, // Línea más gruesa para mejor visibilidad
    stroke: 'rgba(0, 195, 255, 0.8)', // Color base cian más visible
    strokeDasharray: style.animated ? '5, 5' : 'none', // Línea punteada si es animada
    filter: 'drop-shadow(0 0 3px rgba(0, 195, 255, 0.5))', // Efecto de brillo sutil
    transition: 'stroke 0.3s, filter 0.3s', // Transiciones suaves
    ...style // Mantener estilos personalizados
  };

  return (
    <>
      {/* Eliminamos el efecto de brillo que causaba el sombreado negro */}
      <path
        id={id}
        style={baseStyle}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.label && (
        <EdgeText
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          label={data.label}
          labelStyle={{ fill: 'white', fontWeight: 700 }}
          labelBgStyle={{ fill: '#555' }}
          labelBgPadding={[2, 4]}
          labelBgBorderRadius={4}
        />
      )}
    </>
  );
};

/**
 * Componente para renderizar el marcador de fin de arista
 */
const EdgeMarker = () => {
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        {Object.entries(EDGE_COLORS).map(([type, color]) => (
          <marker
            key={`${type}-marker`}
            id={`${type}-marker`}
            viewBox="0 0 12 12"
            refX="6"
            refY="6"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            {/* Efecto de brillo exterior */}
            <circle cx="6" cy="6" r="5.5" fill="none" stroke={color} strokeOpacity="0.3" strokeWidth="1" />
            
            {/* Circulo principal */}
            <circle cx="6" cy="6" r="4" fill={color} />
            
            {/* Brillo interior */}
            <circle cx="6" cy="6" r="2" fill="white" fillOpacity="0.4" />
          </marker>
        ))}
      </defs>
    </svg>
  );
};

export { CustomEdge, BezierEdge, EdgeMarker };

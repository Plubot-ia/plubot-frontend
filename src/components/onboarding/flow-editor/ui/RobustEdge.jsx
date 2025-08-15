import PropTypes from 'prop-types';
import { memo, useEffect, useMemo, useState } from 'react';
import { getBezierPath, EdgeText } from 'reactflow';

import { useFlowNodesEdges } from '@/stores/selectors';

// Componente helper para el fondo de la arista
const EdgeBackground = ({ edgePath }) => (
  <path
    d={edgePath}
    stroke='transparent'
    strokeWidth={10}
    fill='none'
    className='robust-edge-background'
  />
);

// Componente helper para la arista principal
const MainEdge = ({ id, edgePath, edgeStyle, markerEnd }) => (
  <path
    id={id}
    d={edgePath}
    stroke={edgeStyle.stroke}
    strokeWidth={edgeStyle.strokeWidth}
    strokeOpacity={edgeStyle.strokeOpacity}
    fill='none'
    strokeDasharray={edgeStyle.strokeDasharray}
    className='robust-edge'
    markerEnd={markerEnd}
    style={{ zIndex: 5, pointerEvents: 'all' }}
    data-testid={`rf__edge-${id}`}
  />
);

// Componente helper para la etiqueta de la arista
const EdgeLabel = ({ label, labelX, labelY }) =>
  label ? (
    <EdgeText
      x={labelX}
      y={labelY}
      label={label}
      labelStyle={{ fill: 'white', fontWeight: 500, fontSize: 12 }}
      labelBgStyle={{ fill: 'rgba(0, 0, 0, 0.7)' }}
      labelBgPadding={[4, 2]}
      labelBgBorderRadius={2}
    />
  ) : undefined;

// PropTypes para componentes helper
EdgeBackground.propTypes = {
  edgePath: PropTypes.string.isRequired,
};

MainEdge.propTypes = {
  id: PropTypes.string.isRequired,
  edgePath: PropTypes.string.isRequired,
  edgeStyle: PropTypes.object.isRequired,
  markerEnd: PropTypes.any,
};

EdgeLabel.propTypes = {
  label: PropTypes.any,
  labelX: PropTypes.number.isRequired,
  labelY: PropTypes.number.isRequired,
};

// Hook personalizado para lógica de estado y efectos de RobustEdge
const useRobustEdgeLogic = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  edgeStyle,
  data,
}) => {
  // Estado para forzar re-renderizado
  const [, setForceUpdate] = useState(0);
  // Obtener la función para guardar aristas del hook granular
  const { backupEdgesToLocalStorage } = useFlowNodesEdges();

  // Efecto para forzar visibilidad
  useEffect(() => {
    // Forzar un re-renderizado después de montar
    const timer = setTimeout(() => {
      setForceUpdate((previous) => previous + 1);
    }, 100);

    // Escuchar eventos de actualización
    const handleForceUpdate = () => {
      setForceUpdate((previous) => previous + 1);
    };

    document.addEventListener('force-edge-update', handleForceUpdate);
    document.addEventListener('elite-edge-update-required', handleForceUpdate);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('force-edge-update', handleForceUpdate);
      document.removeEventListener('elite-edge-update-required', handleForceUpdate);
    };
  }, [id]);

  // Guardar la arista en localStorage para persistencia
  useEffect(() => {
    try {
      // Solo guardar si tenemos los datos necesarios
      if (id && source && target) {
        const plubotId = globalThis.location.search.match(/plubotId=([^&]*)/)?.[1];
        if (plubotId) {
          // Crear objeto de arista
          const edgeData = {
            id,
            source,
            target,
            sourceX,
            sourceY,
            targetX,
            targetY,
            sourcePosition,
            targetPosition,
            style: edgeStyle,
            data,
            sourceOriginal: source,
            targetOriginal: target,
          };

          // Usar la función del store para guardar la arista
          backupEdgesToLocalStorage([edgeData], plubotId);

          // Disparar evento para notificar que se guardó una arista
          const edgeSavedEvent = new CustomEvent('edge-saved', {
            detail: { edge: edgeData, plubotId },
          });
          document.dispatchEvent(edgeSavedEvent);
        }
      }
    } catch {}
  }, [
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    edgeStyle,
    data,
    backupEdgesToLocalStorage,
  ]);
};

/**
 * RobustEdge - Un componente de arista simplificado y robusto para ReactFlow
 * Diseñado para maximizar la visibilidad y persistencia de las aristas
 */
const RobustEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
  label,
}) => {
  // Calcular la ruta de la arista
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Estilos por defecto memoizados
  const defaultStyle = useMemo(
    () => ({ stroke: '#00e0ff', strokeWidth: 2, strokeOpacity: 0.8 }),
    [],
  );

  // Combinar estilos con useMemo para evitar recreaciones innecesarias
  const edgeStyle = useMemo(
    () => ({
      ...defaultStyle,
      ...style,
      strokeWidth: selected
        ? (style.strokeWidth || defaultStyle.strokeWidth) + 1
        : style.strokeWidth || defaultStyle.strokeWidth,
    }),
    [defaultStyle, style, selected],
  );

  // Usar hook personalizado para lógica de estado y efectos
  useRobustEdgeLogic({
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    edgeStyle,
    data,
  });

  return (
    <>
      <EdgeBackground edgePath={edgePath} />
      <MainEdge id={id} edgePath={edgePath} edgeStyle={edgeStyle} markerEnd={markerEnd} />
      <EdgeLabel label={label} labelX={labelX} labelY={labelY} />
    </>
  );
};

RobustEdge.propTypes = {
  id: PropTypes.string.isRequired,
  source: PropTypes.string.isRequired,
  target: PropTypes.string.isRequired,
  sourceX: PropTypes.number.isRequired,
  sourceY: PropTypes.number.isRequired,
  targetX: PropTypes.number.isRequired,
  targetY: PropTypes.number.isRequired,
  sourcePosition: PropTypes.string,
  targetPosition: PropTypes.string,
  style: PropTypes.object,
  markerEnd: PropTypes.any,
  data: PropTypes.object,
  selected: PropTypes.bool,
  label: PropTypes.any,
};

export default memo(RobustEdge);

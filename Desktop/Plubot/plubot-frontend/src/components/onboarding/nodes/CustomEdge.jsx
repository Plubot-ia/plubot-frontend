import React from 'react';
import { getBezierPath, getEdgeCenter } from 'reactflow';

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  sourceHandleId,
}) => {
  const nodeWidth = 150; // Ajustado para coincidir con el ancho de los nodos en TrainingScreen.jsx
  const outputIndex = sourceHandleId ? parseInt(sourceHandleId.split('-')[1], 10) : 0;
  const offsetX = (outputIndex - 0.5) * (nodeWidth / 2);

  const adjustedSourceX = sourceX + offsetX;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: adjustedSourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={{ ...style, strokeWidth: 2 }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: 12 }}
            startOffset="50%"
            textAnchor="middle"
          >
            {data.label}
          </textPath>
        </text>
      )}
    </>
  );
};

export default CustomEdge;